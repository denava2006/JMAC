import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUser, from } = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getUser }, from },
}))

import { fetchApplicationStats, qualifyApplication, rejectApplication } from '@/services/recruitment'
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_VARIANT,
  applicationStatusLabel,
  applicationStatusVariant,
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
