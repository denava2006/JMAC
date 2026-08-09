import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUser, from } = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getUser }, from },
}))

import { fetchApplication, fetchApplicationStats, qualifyApplication, rejectApplication } from '@/services/recruitment'
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_VARIANT,
  OFFER_DECLINE_REASONS,
  OFFER_STATUS_LABEL,
  OFFER_STATUS_VARIANT,
  applicationStatusLabel,
  applicationStatusVariant,
  offerStatusLabel,
  offerStatusVariant,
  type ApplicationStatus,
} from '@/lib/applicationLabels'

// A chainable stand-in for from('applications').update(...).eq().eq().select().
function updateChain(result: { data: unknown; error: unknown }) {
  const chain = {
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    select: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

beforeEach(() => {
  from.mockReset()
  getUser.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
})

describe('qualifyApplication', () => {
  it('updates the row and writes a history entry', async () => {
    const apps = updateChain({ data: [{ id: 'app-1' }], error: null })
    const historyInsert = vi.fn().mockResolvedValue({ error: null })
    from.mockImplementation((table: string) =>
      table === 'applications' ? apps : { insert: historyInsert }
    )

    await qualifyApplication('app-1')

    expect(apps.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'qualified', reviewed_by: 'user-1' })
    )
    expect(historyInsert).toHaveBeenCalledWith({
      application_id: 'app-1',
      event: 'qualified',
      actor_id: 'user-1',
    })
  })

  it('throws when no submitted row matched (already screened)', async () => {
    const apps = updateChain({ data: [], error: null })
    from.mockImplementation(() => apps)
    await expect(qualifyApplication('app-1')).rejects.toThrow(/already screened/i)
  })
})

describe('rejectApplication', () => {
  it('records the reason on the row and in history', async () => {
    const apps = updateChain({ data: [{ id: 'app-1' }], error: null })
    const historyInsert = vi.fn().mockResolvedValue({ error: null })
    from.mockImplementation((table: string) =>
      table === 'applications' ? apps : { insert: historyInsert }
    )

    await rejectApplication('app-1', 'Does not meet the requirements')

    expect(apps.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'rejected', rejection_reason: 'Does not meet the requirements' })
    )
    expect(historyInsert).toHaveBeenCalledWith({
      application_id: 'app-1',
      event: 'rejected',
      notes: 'Does not meet the requirements',
      actor_id: 'user-1',
    })
  })
})

describe('fetchApplicationStats', () => {
  it('counts submitted, qualified, and rejected', async () => {
    const stats = (count: number) => ({
      select: vi.fn(function (this: unknown) {
        return this
      }),
      eq: vi.fn(() => Promise.resolve({ count, error: null })),
    })
    from.mockReturnValueOnce(stats(3)).mockReturnValueOnce(stats(2)).mockReturnValueOnce(stats(1))

    await expect(fetchApplicationStats()).resolves.toEqual({
      newCount: 3,
      qualifiedCount: 2,
      rejectedCount: 1,
    })
  })
})

describe('fetchApplication', () => {
  function applicationChain(result: { data: unknown; error: { message: string } | null }) {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      maybeSingle: vi.fn(() => Promise.resolve(result)),
    }
    return chain
  }

  it('maps one application into the shared applicant detail shape', async () => {
    const query = applicationChain({
      data: {
        id: 'app-1',
        status: 'hired',
        rejection_reason: null,
        reviewed_at: '2026-08-09T00:00:00Z',
        created_at: '2026-08-08T00:00:00Z',
        applicant_id: 'applicant-1',
        applicants: {
          first_name: 'Ada',
          middle_name: null,
          last_name: 'Applicant',
          email: 'ada@example.com',
          phone: '09170000000',
          address: '1 Main Street',
          province: 'Cebu',
          city: 'Cebu City',
          barangay: 'Lahug',
          resume_url: 'resumes/ada.pdf',
          cover_letter: 'Ready to help.',
        },
        job_postings: {
          employment_type: 'regular',
          positions: { title: 'Cashier' },
          departments: { name: 'Sales' },
        },
        job_offers: [
          { id: 'offer-1', status: 'declined', created_at: '2026-08-09T00:00:00Z' },
          { id: 'offer-2', status: 'pending', created_at: '2026-08-10T00:00:00Z' },
        ],
      },
      error: null,
    })
    from.mockReturnValue(query)

    await expect(fetchApplication('app-1')).resolves.toEqual(expect.objectContaining({
      id: 'app-1',
      applicantName: 'Ada Applicant',
      resumeUrl: 'resumes/ada.pdf',
      positionTitle: 'Cashier',
      department: 'Sales',
      employmentType: 'regular',
      latestOfferStatus: 'pending',
    }))
    expect(query.eq).toHaveBeenCalledWith('id', 'app-1')
  })

  it('reports a missing application clearly', async () => {
    from.mockReturnValue(applicationChain({ data: null, error: null }))
    await expect(fetchApplication('missing')).rejects.toThrow(/no longer available/i)
  })
})

describe('application status labels', () => {
  const statuses: ApplicationStatus[] = [
    'submitted',
    'under_review',
    'qualified',
    'rejected',
    'interview_scheduled',
    'offered',
    'hired',
    'closed',
    'deployed',
  ]

  it('labels and colours every status of the enum', () => {
    for (const status of statuses) {
      expect(APPLICATION_STATUS_LABEL[status]).toBeTruthy()
      expect(APPLICATION_STATUS_VARIANT[status]).toBeTruthy()
    }
    expect(Object.keys(APPLICATION_STATUS_LABEL).sort()).toEqual([...statuses].sort())
  })

  it('falls back to the raw value for an unknown status', () => {
    expect(applicationStatusLabel('mystery')).toBe('mystery')
    expect(applicationStatusVariant('mystery')).toBe('neutral')
  })
})

describe('offer labels', () => {
  it('labels every offer status and keeps decline reasons aligned with the database', () => {
    expect(OFFER_STATUS_LABEL).toEqual({
      pending: 'Awaiting response',
      accepted: 'Accepted',
      declined: 'Declined',
    })
    expect(Object.keys(OFFER_STATUS_VARIANT).sort()).toEqual(['accepted', 'declined', 'pending'])
    expect(offerStatusLabel('pending')).toBe('Awaiting response')
    expect(offerStatusVariant('unknown')).toBe('neutral')
    expect(OFFER_DECLINE_REASONS).toContain('Other')
  })
})
