import { beforeEach, describe, expect, it, vi } from 'vitest'

const { upload, rpc } = vi.hoisted(() => ({ upload: vi.fn(), rpc: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: vi.fn(() => ({ upload })) },
    rpc,
  },
}))

import {
  normalizeName,
  respondToJobOffer,
  submitApplication,
  trackApplication,
  validateResumeFile,
  type SubmitApplicationInput,
} from '@/services/applications'

function pdf(name = 'resume.pdf'): File {
  return new File(['cv'], name, { type: 'application/pdf' })
}

function baseInput(overrides: Partial<SubmitApplicationInput> = {}): SubmitApplicationInput {
  return {
    jobPostingId: 'job-1',
    firstName: 'Juan',
    middleName: '',
    lastName: 'Dela Cruz',
    email: 'juan@example.com',
    phone: '09171234567',
    province: 'Cebu',
    city: 'Cebu City',
    barangay: 'Lahug',
    street: '123 Mango Ave',
    resumeFile: pdf(),
    ...overrides,
  }
}

describe('validateResumeFile', () => {
  it('accepts a PDF within the size limit', () => {
    expect(validateResumeFile(pdf())).toBeNull()
  })

  it('rejects an unsupported type', () => {
    const png = new File(['x'], 'shot.png', { type: 'image/png' })
    expect(validateResumeFile(png)).toMatch(/PDF, DOC, or DOCX/)
  })

  it('rejects a file over 5 MB', () => {
    const big = pdf('big.pdf')
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 })
    expect(validateResumeFile(big)).toMatch(/5 MB/)
  })
})

describe('submitApplication', () => {
  beforeEach(() => {
    upload.mockReset()
    rpc.mockReset()
  })

  it('uploads the resume then calls the RPC and returns the reference code', async () => {
    upload.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: [{ reference_code: 'JMAC-2026-0007' }], error: null })

    const result = await submitApplication(baseInput({ street: '123 Mango Ave', coverLetter: 'Hire me' }))

    expect(result).toEqual({ referenceCode: 'JMAC-2026-0007' })
    expect(upload).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith(
      'submit_job_application',
      expect.objectContaining({
        p_job_posting_id: 'job-1',
        p_address: '123 Mango Ave',
        p_province: 'Cebu',
        p_city: 'Cebu City',
        p_barangay: 'Lahug',
        p_cover_letter: 'Hire me',
      })
    )
    // Empty optionals become undefined, not '', so the RPC uses its defaults.
    expect(rpc.mock.calls[0]![1].p_middle_name).toBeUndefined()
  })

  // The RPC matches applicants with `where email = p_email`, so casing decides
  // whether a repeat applicant is the same person or a brand new one.
  it('normalizes the email so casing cannot fork an applicant identity', async () => {
    upload.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: [{ reference_code: 'APP-2026-0009' }], error: null })

    await submitApplication(baseInput({ email: '  Juan.DelaCruz@Example.COM ' }))

    expect(rpc.mock.calls[0]![1].p_email).toBe('juan.delacruz@example.com')
  })

  it('does not call the RPC when the resume upload fails', async () => {
    upload.mockResolvedValue({ error: { message: 'storage down' } })

    await expect(submitApplication(baseInput())).rejects.toThrow(/upload your resume/i)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('maps a known RPC error code to a friendly message', async () => {
    upload.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: null, error: { message: 'DUPLICATE_APPLICATION' } })

    await expect(submitApplication(baseInput())).rejects.toThrow(/already applied/i)
  })

  it('falls back to a generic message for an unknown RPC error', async () => {
    upload.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: null, error: { message: 'SOMETHING_ELSE' } })

    await expect(submitApplication(baseInput())).rejects.toThrow(/couldn’t submit your application/i)
  })
})

describe('trackApplication', () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it('maps a found application, with no interview until one is scheduled', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          reference_code: 'APP-2026-0001',
          status: 'under_review',
          submitted_at: '2026-08-01T00:00:00Z',
          applicant_name: 'Juan Dela Cruz',
          position_title: 'Cashier',
          department_name: 'Sales',
          interview_scheduled_at: null,
        },
      ],
      error: null,
    })

    const result = await trackApplication(' APP-2026-0001 ', ' juan@example.com ')

    expect(rpc).toHaveBeenCalledWith('lookup_application', {
      p_reference_code: 'APP-2026-0001',
      p_email: 'juan@example.com',
    })
    expect(result).toMatchObject({
      referenceCode: 'APP-2026-0001',
      status: 'under_review',
      applicantName: 'Juan Dela Cruz',
      positionTitle: 'Cashier',
      interview: null,
    })
  })

  it('surfaces the interview block once one is scheduled', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          reference_code: 'APP-2026-0002',
          status: 'interview_scheduled',
          submitted_at: '2026-08-01T00:00:00Z',
          applicant_name: 'Ana Reyes',
          position_title: 'Cashier',
          department_name: 'Sales',
          interview_type: 'initial',
          interview_scheduled_at: '2026-08-10T02:00:00Z',
          interview_mode: 'online',
          interview_status: 'scheduled',
        },
      ],
      error: null,
    })

    const result = await trackApplication('APP-2026-0002', 'ana@example.com')
    expect(result.interview).toMatchObject({ type: 'initial', mode: 'online', status: 'scheduled' })
  })

  it('maps all applicant-visible fields from a pending offer', async () => {
    rpc.mockResolvedValue({
      data: [{
        reference_code: 'APP-2026-0003',
        status: 'offered',
        submitted_at: '2026-08-01T00:00:00Z',
        applicant_name: 'Mia Santos',
        position_title: 'Cashier',
        department_name: 'Sales',
        interview_scheduled_at: null,
        offer_id: 'offer-1',
        offer_status: 'pending',
        offer_employment_type: 'regular',
        offer_salary: 20_000,
        offer_currency: 'PHP',
        offer_start_date: '2026-09-01',
        offer_working_hours: '8:00 AM - 5:00 PM',
        offer_working_days: 'Monday, Tuesday, Wednesday, Thursday, Friday',
        offer_benefits: 'Government benefits',
        offer_additional_compensation: 'Performance bonus',
      }],
      error: null,
    })

    const result = await trackApplication('APP-2026-0003', 'mia@example.com')
    expect(result.offer).toEqual({
      id: 'offer-1',
      status: 'pending',
      employmentType: 'regular',
      salary: 20_000,
      currency: 'PHP',
      startDate: '2026-09-01',
      workingHours: '8:00 AM - 5:00 PM',
      workingDays: 'Monday, Tuesday, Wednesday, Thursday, Friday',
      benefits: 'Government benefits',
      additionalCompensation: 'Performance bonus',
    })
  })

  it('normalizes the email so a differently-cased retype still matches', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          reference_code: 'APP-2026-0001',
          status: 'submitted',
          submitted_at: '2026-08-01T00:00:00Z',
          applicant_name: 'Juan Dela Cruz',
          position_title: 'Cashier',
          department_name: 'Sales',
          interview_scheduled_at: null,
        },
      ],
      error: null,
    })

    await trackApplication('APP-2026-0001', '  Juan.DelaCruz@Example.COM ')

    expect(rpc).toHaveBeenCalledWith('lookup_application', {
      p_reference_code: 'APP-2026-0001',
      p_email: 'juan.delacruz@example.com',
    })
  })

  it('throws a friendly message when nothing matches', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    await expect(trackApplication('APP-0000-0000', 'nobody@example.com')).rejects.toThrow(/No application matches/i)
  })

  it('throws a generic message on RPC error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await expect(trackApplication('APP-2026-0001', 'juan@example.com')).rejects.toThrow(/couldn’t check that application/i)
  })
})

describe('respondToJobOffer', () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it('normalizes credentials and accepts without sending decline details', async () => {
    rpc.mockResolvedValue({ data: 'accepted', error: null })

    await expect(respondToJobOffer({
      referenceCode: ' APP-2026-0003 ',
      email: ' Mia@Example.COM ',
      decision: 'accepted',
    })).resolves.toBe('accepted')

    expect(rpc).toHaveBeenCalledWith('respond_to_job_offer', {
      p_reference_code: 'APP-2026-0003',
      p_email: 'mia@example.com',
      p_decision: 'accepted',
      p_decline_reason: undefined,
      p_decline_notes: undefined,
    })
  })

  it('requires a decline reason before calling the RPC', async () => {
    await expect(respondToJobOffer({
      referenceCode: 'APP-2026-0003',
      email: 'mia@example.com',
      decision: 'declined',
    })).rejects.toThrow(/reason/i)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('trims the selected decline reason and optional notes', async () => {
    rpc.mockResolvedValue({ data: 'declined', error: null })

    await respondToJobOffer({
      referenceCode: 'APP-2026-0003',
      email: 'mia@example.com',
      decision: 'declined',
      declineReason: 'Other',
      declineNotes: '  Start date does not work.  ',
    })

    expect(rpc).toHaveBeenCalledWith('respond_to_job_offer', expect.objectContaining({
      p_decision: 'declined',
      p_decline_reason: 'Other',
      p_decline_notes: 'Start date does not work.',
    }))
  })

  it.each([
    ['NOT_FOUND', /no application matches/i],
    ['NO_OFFER', /no job offer/i],
    ['OFFER_NOT_AVAILABLE', /no longer available/i],
    ['ALREADY_RESPONDED', /already been answered/i],
    ['INVALID_DECISION', /accept or decline/i],
    ['DECLINE_REASON_REQUIRED', /reason/i],
  ])('maps %s to a friendly response error', async (code, message) => {
    rpc.mockResolvedValue({ data: null, error: { message: code } })
    await expect(respondToJobOffer({
      referenceCode: 'APP-2026-0003',
      email: 'mia@example.com',
      decision: 'accepted',
    })).rejects.toThrow(message)
  })
})

describe('normalizeName', () => {
  // Stored at submit time, because Recruitment, Interviews, the offer, the
  // contract and the employee record all read the stored value.
  it.each([
    ['clark', 'Clark'],
    ['ong', 'Ong'],
    ['de nava', 'De Nava'],
    ['mary jane', 'Mary Jane'],
    ['dela cruz', 'Dela Cruz'],
    ['DE LA CRUZ', 'De La Cruz'],
    ['smith-jones', 'Smith-Jones'],
    ["o'brien", "O'Brien"],
    ['  juan   santos  ', 'Juan Santos'],
    ['JUAN', 'Juan'],
  ])('capitalizes %j as %j', (input, expected) => {
    expect(normalizeName(input)).toBe(expected)
  })
})

describe('submitApplication name capitalization', () => {
  beforeEach(() => {
    upload.mockReset()
    rpc.mockReset()
  })

  it('stores capitalized names rather than what was typed', async () => {
    upload.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: [{ reference_code: 'APP-2026-0100' }], error: null })

    await submitApplication(
      baseInput({ firstName: 'clark', middleName: 'ong', lastName: 'de nava' })
    )

    const args = rpc.mock.calls[0]![1]
    expect(args.p_first_name).toBe('Clark')
    expect(args.p_middle_name).toBe('Ong')
    expect(args.p_last_name).toBe('De Nava')
  })

  it('leaves an omitted middle name undefined instead of empty', async () => {
    upload.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: [{ reference_code: 'APP-2026-0101' }], error: null })

    await submitApplication(baseInput({ middleName: '' }))

    expect(rpc.mock.calls[0]![1].p_middle_name).toBeUndefined()
  })
})
