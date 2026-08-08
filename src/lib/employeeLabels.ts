import type { BadgeProps } from '@/components/ui/badge'

/** jmac-suite's employment_status enum. Adapted from HRMS's employeeLabels.ts,
 *  with the badge variants remapped to JMAC's set — HRMS uses 'muted' and
 *  'destructive', which this design system spells 'neutral' and 'error'. */
export type EmploymentStatus = 'active' | 'on_leave' | 'resigned' | 'terminated' | 'retired'

export const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> = {
  active: 'Active',
  on_leave: 'On leave',
  resigned: 'Resigned',
  terminated: 'Terminated',
  retired: 'Retired',
}

export const EMPLOYMENT_STATUS_VARIANT: Record<EmploymentStatus, BadgeProps['variant']> = {
  active: 'success',
  on_leave: 'warning',
  resigned: 'neutral',
  terminated: 'error',
  retired: 'neutral',
}

export function employmentStatusLabel(status: string): string {
  return EMPLOYMENT_STATUS_LABEL[status as EmploymentStatus] ?? status
}

export function employmentStatusVariant(status: string): BadgeProps['variant'] {
  return EMPLOYMENT_STATUS_VARIANT[status as EmploymentStatus] ?? 'neutral'
}

/**
 * Employee employment types.
 *
 * Deliberately NOT the careers page's set. `employees.employment_type` is a
 * free-text column holding 'full_time' / 'part_time', while
 * `job_postings.employment_type` is a Postgres enum of (regular, part_time).
 * They are two different systems that happen to share a column name, and
 * assuming they matched printed a raw 'full_time' in the employee table. The
 * fallback below covers any other free-text value the column may hold.
 */
export const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  probationary: 'Probationary',
  regular: 'Regular',
}

export function employmentTypeLabel(type: string | null): string {
  if (!type) return '—'
  return EMPLOYMENT_TYPE_LABEL[type] ?? type.replace(/_/g, ' ')
}
