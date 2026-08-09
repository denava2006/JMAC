import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/database.types'

export type OfferEmploymentType = Enums<'employment_type'>

export interface SalaryGradeOption {
  id: string
  name: string
  employmentType: OfferEmploymentType
  minSalary: number
  maxSalary: number
}

export interface WorkScheduleOption {
  id: string
  name: string
  employmentType: OfferEmploymentType
  workingDays: number[]
  startTime: string
  endTime: string
  isDefault: boolean
}

export interface OfferOptions {
  salaryGrades: SalaryGradeOption[]
  workSchedules: WorkScheduleOption[]
}

export async function fetchOfferOptions(employmentType: OfferEmploymentType): Promise<OfferOptions> {
  const [grades, schedules] = await Promise.all([
    supabase
      .from('salary_grades')
      .select('id, grade_name, employment_type, min_salary, max_salary')
      .eq('employment_type', employmentType)
      .order('min_salary'),
    supabase
      .from('work_schedules')
      .select('id, name, employment_type, working_days, start_time, end_time, is_default')
      .eq('employment_type', employmentType)
      .order('name'),
  ])

  if (grades.error) throw new Error(`Could not load salary grades: ${grades.error.message}`)
  if (schedules.error) throw new Error(`Could not load work schedules: ${schedules.error.message}`)

  return {
    salaryGrades: (grades.data ?? []).map((grade) => ({
      id: grade.id,
      name: grade.grade_name,
      employmentType: grade.employment_type,
      minSalary: grade.min_salary,
      maxSalary: grade.max_salary,
    })),
    workSchedules: (schedules.data ?? []).map((schedule) => ({
      id: schedule.id,
      name: schedule.name,
      employmentType: schedule.employment_type,
      workingDays: schedule.working_days,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      isDefault: schedule.is_default,
    })),
  }
}

export interface PrepareJobOfferInput {
  applicationId: string
  proposedSalary: number
  salaryGradeId: string
  workScheduleId: string
  startDate: string
  benefits?: string
  additionalCompensation?: string
  notes?: string
}

function localIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function isFutureOfferDate(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && localIsoDate(date) === value && value > localIsoDate(now)
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

const PREPARE_ERROR_MESSAGES: Array<[string, string]> = [
  ['OFFER_NOT_AUTHORIZED', 'You are not authorized to prepare job offers.'],
  ['OFFER_APPLICATION_NOT_FOUND', 'This application is no longer available.'],
  ['OFFER_APPLICATION_NOT_READY', 'This application is not ready for a job offer.'],
  ['OFFER_APPLICATION_STATE_INVALID', 'This application already has conflicting offer history.'],
  ['OFFER_ALREADY_PENDING', 'This application already has a pending job offer.'],
  ['OFFER_ALREADY_ACCEPTED', 'The applicant has already accepted a job offer.'],
  ['OFFER_DECLINED_REVISION_REQUIRED', 'A revised offer can only follow a declined offer.'],
  ['OFFER_SALARY_GRADE_NOT_FOUND', 'That salary grade is no longer available.'],
  ['OFFER_SALARY_GRADE_MISMATCH', 'That salary grade does not match the posting employment type.'],
  ['OFFER_SALARY_OUT_OF_RANGE', 'The salary must stay within the selected grade range.'],
  ['OFFER_WORK_SCHEDULE_NOT_FOUND', 'That work schedule is no longer available.'],
  ['OFFER_WORK_SCHEDULE_MISMATCH', 'That work schedule does not match the posting employment type.'],
  ['OFFER_START_DATE_INVALID', 'Choose a start date of tomorrow or later.'],
]

function prepareError(message: string): Error {
  const match = PREPARE_ERROR_MESSAGES.find(([code]) => message.includes(code))
  return new Error(match?.[1] ?? 'Could not prepare the job offer. Please try again.')
}

export async function prepareJobOffer(input: PrepareJobOfferInput): Promise<string> {
  if (!input.applicationId.trim()) throw new Error('This application is no longer available.')
  if (!input.salaryGradeId.trim()) throw new Error('Choose a salary grade.')
  if (!Number.isFinite(input.proposedSalary) || input.proposedSalary <= 0) {
    throw new Error('Enter a valid salary greater than zero.')
  }
  if (!input.workScheduleId.trim()) throw new Error('Choose a work schedule.')
  if (!isFutureOfferDate(input.startDate)) throw new Error('Choose a start date of tomorrow or later.')

  const { data, error } = await supabase.rpc('prepare_job_offer', {
    p_application_id: input.applicationId,
    p_proposed_salary: input.proposedSalary,
    p_salary_grade_id: input.salaryGradeId,
    p_work_schedule_id: input.workScheduleId,
    p_start_date: input.startDate,
    p_benefits: optionalText(input.benefits),
    p_additional_compensation: optionalText(input.additionalCompensation),
    p_notes: optionalText(input.notes),
  })

  if (error) throw prepareError(error.message)
  if (!data) throw new Error('The offer was prepared, but its reference could not be read.')
  return data
}

export const offerOptionsQueryKey = (employmentType: OfferEmploymentType) =>
  ['people', 'offer-options', employmentType] as const

