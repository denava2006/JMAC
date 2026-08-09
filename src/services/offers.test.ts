import { beforeEach, describe, expect, it, vi } from 'vitest'

const { from, rpc } = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }))

vi.mock('@/lib/supabase', () => ({ supabase: { from, rpc } }))

import {
  fetchOfferOptions,
  isFutureOfferDate,
  prepareJobOffer,
  type PrepareJobOfferInput,
} from '@/services/offers'

function listChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

function validInput(overrides: Partial<PrepareJobOfferInput> = {}): PrepareJobOfferInput {
  return {
    applicationId: 'app-1',
    proposedSalary: 20_000,
    salaryGradeId: 'grade-1',
    workScheduleId: 'schedule-1',
    startDate: '2099-01-02',
    ...overrides,
  }
}

beforeEach(() => {
  from.mockReset()
  rpc.mockReset()
})

describe('fetchOfferOptions', () => {
  it('filters both lookups by the posting employment type and maps the rows', async () => {
    const grades = listChain({
      data: [{ id: 'g1', grade_name: 'Grade 1', employment_type: 'regular', min_salary: 15_000, max_salary: 20_000 }],
      error: null,
    })
    const schedules = listChain({
      data: [{
        id: 's1',
        name: 'Day shift',
        employment_type: 'regular',
        working_days: [1, 2, 3, 4, 5],
        start_time: '08:00:00',
        end_time: '17:00:00',
        is_default: true,
      }],
      error: null,
    })
    from.mockReturnValueOnce(grades).mockReturnValueOnce(schedules)

    await expect(fetchOfferOptions('regular')).resolves.toEqual({
      salaryGrades: [{ id: 'g1', name: 'Grade 1', employmentType: 'regular', minSalary: 15_000, maxSalary: 20_000 }],
      workSchedules: [{
        id: 's1',
        name: 'Day shift',
        employmentType: 'regular',
        workingDays: [1, 2, 3, 4, 5],
        startTime: '08:00:00',
        endTime: '17:00:00',
        isDefault: true,
      }],
    })
    expect(grades.eq).toHaveBeenCalledWith('employment_type', 'regular')
    expect(schedules.eq).toHaveBeenCalledWith('employment_type', 'regular')
  })

  it('surfaces a lookup failure', async () => {
    from
      .mockReturnValueOnce(listChain({ data: null, error: { message: 'grades down' } }))
      .mockReturnValueOnce(listChain({ data: [], error: null }))
    await expect(fetchOfferOptions('part_time')).rejects.toThrow(/salary grades: grades down/i)
  })
})

describe('isFutureOfferDate', () => {
  const now = new Date('2026-08-09T12:00:00')

  it('accepts tomorrow and rejects today, past, and invalid calendar dates', () => {
    expect(isFutureOfferDate('2026-08-10', now)).toBe(true)
    expect(isFutureOfferDate('2026-08-09', now)).toBe(false)
    expect(isFutureOfferDate('2026-08-08', now)).toBe(false)
    expect(isFutureOfferDate('2026-02-30', now)).toBe(false)
  })
})

describe('prepareJobOffer', () => {
  it('calls only the atomic RPC and leaves authoritative fields to the database', async () => {
    rpc.mockResolvedValue({ data: 'offer-1', error: null })

    await expect(prepareJobOffer(validInput({
      benefits: '  Government benefits ',
      additionalCompensation: '   ',
      notes: '  Starts after onboarding ',
    }))).resolves.toBe('offer-1')

    expect(rpc).toHaveBeenCalledWith('prepare_job_offer', {
      p_application_id: 'app-1',
      p_proposed_salary: 20_000,
      p_salary_grade_id: 'grade-1',
      p_work_schedule_id: 'schedule-1',
      p_start_date: '2099-01-02',
      p_benefits: 'Government benefits',
      p_additional_compensation: undefined,
      p_notes: 'Starts after onboarding',
    })
    const sent = rpc.mock.calls[0]![1]
    expect(sent).not.toHaveProperty('p_employment_type')
    expect(sent).not.toHaveProperty('p_currency')
    expect(sent).not.toHaveProperty('p_prepared_by')
    expect(sent).not.toHaveProperty('p_working_days')
    expect(sent).not.toHaveProperty('p_working_hours')
  })

  it.each([
    [{ applicationId: '' }, /no longer available/i],
    [{ salaryGradeId: '' }, /salary grade/i],
    [{ proposedSalary: 0 }, /greater than zero/i],
    [{ proposedSalary: Number.NaN }, /greater than zero/i],
    [{ workScheduleId: '' }, /work schedule/i],
    [{ startDate: '2020-01-01' }, /tomorrow or later/i],
  ] as const)('rejects invalid input before the RPC: %o', async (override, message) => {
    await expect(prepareJobOffer(validInput(override))).rejects.toThrow(message)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('maps a database validation code to an actionable message', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'OFFER_SALARY_OUT_OF_RANGE' } })
    await expect(prepareJobOffer(validInput())).rejects.toThrow(/within the selected grade range/i)
  })
})

