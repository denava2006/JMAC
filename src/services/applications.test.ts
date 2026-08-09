import { beforeEach, describe, expect, it, vi } from 'vitest'

const { upload, rpc } = vi.hoisted(() => ({ upload: vi.fn(), rpc: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: vi.fn(() => ({ upload })) },
    rpc,
  },
}))

import {
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

    expect(rpc.mock.calls[0][1].p_email).toBe('juan.delacruz@example.com')
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
