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
    detail: 'Your interview details are below — please make a note of the date and time.',
  },
  offered: {
    label: 'Job offer',
    detail: 'Congratulations — you’ve received a job offer. Our HR team will be in touch with the details.',
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
