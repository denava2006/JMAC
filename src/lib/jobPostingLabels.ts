import type { BadgeProps } from '@/components/ui/badge'

/** job_posting_status enum: draft, open, closed. */
export type JobPostingStatus = 'draft' | 'open' | 'closed'

export const JOB_POSTING_STATUS_LABEL: Record<JobPostingStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
}

export const JOB_POSTING_STATUS_VARIANT: Record<JobPostingStatus, BadgeProps['variant']> = {
  draft: 'neutral',
  open: 'success',
  closed: 'error',
}

export function jobPostingStatusLabel(status: string): string {
  return JOB_POSTING_STATUS_LABEL[status as JobPostingStatus] ?? status
}

export function jobPostingStatusVariant(status: string): BadgeProps['variant'] {
  return JOB_POSTING_STATUS_VARIANT[status as JobPostingStatus] ?? 'neutral'
}

/** job_postings.employment_type is the enum (regular, part_time) — the same
 *  the public careers page uses, and NOT the employees table's free-text
 *  column. See services/careers.ts and lib/employeeLabels.ts for why those
 *  two must not be conflated. */
export type JobEmploymentType = 'regular' | 'part_time'

export const JOB_EMPLOYMENT_TYPES: JobEmploymentType[] = ['regular', 'part_time']

export const JOB_EMPLOYMENT_TYPE_LABEL: Record<JobEmploymentType, string> = {
  regular: 'Regular',
  part_time: 'Part time',
}

export function jobEmploymentTypeLabel(type: string): string {
  return JOB_EMPLOYMENT_TYPE_LABEL[type as JobEmploymentType] ?? type
}
