import type { BadgeProps } from '@/components/ui/badge'

/** jmac-suite's interview_status enum. */
export type InterviewStatus = 'scheduled' | 'passed' | 'failed' | 'completed' | 'cancelled'
/** interview_type enum. */
export type InterviewStage = 'initial' | 'final'

export const INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  passed: 'Passed',
  failed: 'Failed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const INTERVIEW_STATUS_VARIANT: Record<InterviewStatus, BadgeProps['variant']> = {
  scheduled: 'info',
  passed: 'success',
  failed: 'error',
  completed: 'neutral',
  cancelled: 'neutral',
}

export const INTERVIEW_STAGE_LABEL: Record<InterviewStage, string> = {
  initial: 'Initial',
  final: 'Final',
}

export function interviewStatusLabel(status: string): string {
  return INTERVIEW_STATUS_LABEL[status as InterviewStatus] ?? status
}

export function interviewStatusVariant(status: string): BadgeProps['variant'] {
  return INTERVIEW_STATUS_VARIANT[status as InterviewStatus] ?? 'neutral'
}

export function interviewStageLabel(stage: string): string {
  return INTERVIEW_STAGE_LABEL[stage as InterviewStage] ?? stage
}
