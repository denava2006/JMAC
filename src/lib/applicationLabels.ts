import type { BadgeProps } from '@/components/ui/badge'

/** jmac-suite's application_status enum, in pipeline order. */
export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'qualified'
  | 'rejected'
  | 'interview_scheduled'
  | 'offered'
  | 'hired'
  | 'closed'
  | 'deployed'

// HR-facing labels. 'submitted' reads as "New" here — that is the reviewer's
// word for an application that has just arrived and nobody has touched.
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: 'New',
  under_review: 'Under review',
  qualified: 'Qualified',
  rejected: 'Rejected',
  interview_scheduled: 'Interview scheduled',
  offered: 'Offered',
  hired: 'Hired',
  closed: 'Closed',
  deployed: 'Deployed',
}

export const APPLICATION_STATUS_VARIANT: Record<ApplicationStatus, BadgeProps['variant']> = {
  submitted: 'info',
  under_review: 'warning',
  qualified: 'success',
  rejected: 'error',
  interview_scheduled: 'info',
  offered: 'info',
  hired: 'success',
  closed: 'neutral',
  deployed: 'success',
}

export function applicationStatusLabel(status: string): string {
  return APPLICATION_STATUS_LABEL[status as ApplicationStatus] ?? status
}

export function applicationStatusVariant(status: string): BadgeProps['variant'] {
  return APPLICATION_STATUS_VARIANT[status as ApplicationStatus] ?? 'neutral'
}

export type OfferStatus = 'pending' | 'accepted' | 'declined'

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  pending: 'Awaiting response',
  accepted: 'Accepted',
  declined: 'Declined',
}

export const OFFER_STATUS_VARIANT: Record<OfferStatus, BadgeProps['variant']> = {
  pending: 'warning',
  accepted: 'success',
  declined: 'error',
}

export const OFFER_DECLINE_REASONS = [
  'Accepted another job offer',
  'Salary expectation',
  'Personal reason',
  'Location',
  'Schedule conflict',
  'Other',
] as const

export type OfferDeclineReason = (typeof OFFER_DECLINE_REASONS)[number]

export function offerStatusLabel(status: string): string {
  return OFFER_STATUS_LABEL[status as OfferStatus] ?? status
}

export function offerStatusVariant(status: string): BadgeProps['variant'] {
  return OFFER_STATUS_VARIANT[status as OfferStatus] ?? 'neutral'
}

/** Plain-language status for the applicant's own tracking page. The internal
 *  labels above are written for HR and leak process detail an applicant should
 *  not read (e.g. "New"). Ported from the HRMS applicant portal. */
export const APPLICANT_STATUS_COPY: Record<ApplicationStatus, { label: string; detail: string }> = {
  submitted: {
    label: 'Application received',
    detail: 'We’ve received your application and it’s waiting to be screened.',
  },
  under_review: {
    label: 'Under review',
    detail: 'Our HR team is reviewing your application.',
  },
  qualified: {
    label: 'Shortlisted',
    detail: 'You’ve been shortlisted. We’ll be in touch to arrange an interview.',
  },
  interview_scheduled: {
    label: 'Interview scheduled',
    detail: 'Your application is in the interview stage. Scheduled interview details appear below when available.',
  },
  offered: {
    label: 'Job offer',
    detail: 'Congratulations — you’ve received a job offer. Review the terms below and record your response.',
  },
  hired: {
    label: 'Offer stage',
    detail: 'You’ve passed the interview process. Your job offer is being prepared.',
  },
  deployed: {
    label: 'Welcome aboard',
    detail: 'Your onboarding is complete. Welcome to the team!',
  },
  rejected: {
    label: 'Not successful',
    detail: 'Thank you for your interest. We won’t be moving forward with this application.',
  },
  closed: {
    label: 'Closed',
    detail: 'This application has been closed.',
  },
}

export function applicantStatusCopy(status: string): { label: string; detail: string } {
  return APPLICANT_STATUS_COPY[status as ApplicationStatus] ?? { label: status, detail: '' }
}
