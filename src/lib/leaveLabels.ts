import type { BadgeProps } from '@/components/ui/badge'

/** jmac-suite's leave_request_status enum. Ported from HRMS leaveLabels.ts,
 *  badge variants remapped to JMAC's set (muted->neutral, destructive->error). */
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const LEAVE_STATUS_VARIANT: Record<LeaveStatus, BadgeProps['variant']> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'neutral',
}

export function leaveStatusLabel(status: string): string {
  return LEAVE_STATUS_LABEL[status as LeaveStatus] ?? status
}

export function leaveStatusVariant(status: string): BadgeProps['variant'] {
  return LEAVE_STATUS_VARIANT[status as LeaveStatus] ?? 'neutral'
}

export const LEAVE_REJECTION_PRESETS = [
  'Insufficient leave credits',
  'Department staffing requirement',
  'Incomplete documents',
  'Invalid request',
  'Other',
] as const

/** Inclusive whole-day count between two ISO dates. A one-day leave (start ===
 *  end) is one day, not zero — the reason days_requested is not just a date
 *  subtraction. Weekends and holidays are not netted out here; that is a
 *  balance-calculation concern the schema does not model yet. */
export function inclusiveDays(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00`)
  const end = new Date(`${endIso}T00:00:00`)
  const ms = end.getTime() - start.getTime()
  if (Number.isNaN(ms) || ms < 0) return 0
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1
}
