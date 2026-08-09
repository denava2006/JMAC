import { supabase } from '@/lib/supabase'
import { OFFER_DECLINE_REASONS, type OfferDeclineReason, type OfferStatus } from '@/lib/applicationLabels'
import type { JobEmploymentType } from '@/lib/jobPostingLabels'

/**
 * Public job applications.
 *
 * The submit path is anonymous: the `resumes` bucket allows anon upload
 * (`anyone_can_upload_resume`) and the `submit_job_application` RPC inserts the
 * applicant + application atomically and generates the reference code. Nothing
 * here needs a session — a candidate applies without an account.
 */

/**
 * Applicant identity is the email address, and `submit_job_application` matches
 * it with a plain `where email = p_email` — no case folding. Left as typed,
 * "Juan@Example.com" and "juan@example.com" become two different applicants,
 * and an applicant who capitalises differently when tracking cannot find the
 * application they just submitted. Normalising on the way in and on lookup
 * keeps one person to one record on every path this client owns.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Capitalises a name the way it is written down, at save time rather than in
 * the display layer — the stored value is what Recruitment, Interviews, the
 * offer, the contract and the employee record all read, so fixing it in CSS
 * would leave every downstream document showing "clark de nava".
 *
 * Each whitespace- or hyphen-separated part gets an initial capital and a
 * lowercase remainder: "de nava" -> "De Nava", "mary jane" -> "Mary Jane",
 * "SMITH-JONES" -> "Smith-Jones", "o'brien" -> "O'Brien". Internal runs of
 * whitespace collapse to one space.
 *
 * This is deliberately mechanical. Names that are genuinely not
 * initial-capitalised (van der Berg, McDonald) are left to HR to correct on the
 * employee record; guessing at those rules would mangle more names than it
 * fixed.
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (_match, boundary: string, letter: string) => boundary + letter.toUpperCase())
}

const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_RESUME_BYTES = 5 * 1024 * 1024

/** Returns an error message if the file is the wrong type or too large, or null
 *  if it is acceptable. */
export function validateResumeFile(file: File): string | null {
  if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
    return 'Only PDF, DOC, or DOCX files are accepted.'
  }
  if (file.size > MAX_RESUME_BYTES) {
    return 'File is too large — the maximum size is 5 MB.'
  }
  return null
}

async function uploadResume(jobPostingId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
  const path = `${jobPostingId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('resumes').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error('Could not upload your resume. Please try again.')
  return path
}

export interface SubmitApplicationInput {
  jobPostingId: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  province: string
  city: string
  barangay: string
  street: string
  coverLetter?: string
  resumeFile: File
}

// Codes the RPC raises, mapped to sentences an applicant can act on.
const FRIENDLY_ERRORS: Record<string, string> = {
  JOB_NOT_FOUND: 'This job posting could not be found.',
  JOB_CLOSED: 'This job posting is no longer accepting applications.',
  DUPLICATE_APPLICATION: 'You have already applied to this job with this email address.',
}

export async function submitApplication(
  input: SubmitApplicationInput
): Promise<{ referenceCode: string }> {
  const resumePath = await uploadResume(input.jobPostingId, input.resumeFile)

  const { data, error } = await supabase.rpc('submit_job_application', {
    p_job_posting_id: input.jobPostingId,
    p_first_name: normalizeName(input.firstName),
    p_middle_name: input.middleName ? normalizeName(input.middleName) : undefined,
    p_last_name: normalizeName(input.lastName),
    p_email: normalizeEmail(input.email),
    p_phone: input.phone,
    p_address: input.street,
    p_province: input.province,
    p_city: input.city,
    p_barangay: input.barangay,
    p_resume_path: resumePath,
    p_cover_letter: input.coverLetter || undefined,
  })

  if (error) {
    throw new Error(FRIENDLY_ERRORS[error.message] ?? 'We couldn’t submit your application. Please try again.')
  }

  const referenceCode = (data as { reference_code: string }[] | null)?.[0]?.reference_code
  if (!referenceCode) {
    throw new Error('Your application was submitted, but we could not read its reference number.')
  }
  return { referenceCode }
}

interface LookupRow {
  reference_code: string
  status: string
  submitted_at: string
  applicant_name: string
  position_title: string | null
  department_name: string | null
  interview_type: string | null
  interview_scheduled_at: string | null
  interview_mode: string | null
  interview_location: string | null
  interview_meeting_link: string | null
  interview_status: string | null
  offer_id: string | null
  offer_status: OfferStatus | null
  offer_employment_type: JobEmploymentType | null
  offer_salary: number | null
  offer_currency: string | null
  offer_start_date: string | null
  offer_working_hours: string | null
  offer_working_days: string | null
  offer_benefits: string | null
  offer_additional_compensation: string | null
}

export interface TrackedApplication {
  referenceCode: string
  status: string
  submittedAt: string
  applicantName: string
  positionTitle: string | null
  departmentName: string | null
  /** Present only once an interview has been scheduled (later pipeline slices). */
  interview: {
    type: string | null
    scheduledAt: string | null
    mode: string | null
    location: string | null
    meetingLink: string | null
    status: string | null
  } | null
  offer: {
    id: string
    status: OfferStatus
    employmentType: JobEmploymentType | null
    salary: number | null
    currency: string | null
    startDate: string | null
    workingHours: string | null
    workingDays: string | null
    benefits: string | null
    additionalCompensation: string | null
  } | null
}

/**
 * Look up an application by its reference code and the email it was submitted
 * with. Applicants are not accounts — the `lookup_application` RPC matches both
 * server-side and is the only way an anonymous visitor can read one row.
 */
export async function trackApplication(referenceCode: string, email: string): Promise<TrackedApplication> {
  const { data, error } = await supabase.rpc('lookup_application', {
    p_reference_code: referenceCode.trim(),
    p_email: normalizeEmail(email),
  })
  if (error) {
    throw new Error('We couldn’t check that application right now. Please try again.')
  }
  const row = (data as LookupRow[] | null)?.[0]
  if (!row) {
    throw new Error('No application matches that reference number and email address.')
  }
  return {
    referenceCode: row.reference_code,
    status: row.status,
    submittedAt: row.submitted_at,
    applicantName: row.applicant_name,
    positionTitle: row.position_title,
    departmentName: row.department_name,
    interview: row.interview_scheduled_at
      ? {
          type: row.interview_type,
          scheduledAt: row.interview_scheduled_at,
          mode: row.interview_mode,
          location: row.interview_location,
          meetingLink: row.interview_meeting_link,
          status: row.interview_status,
        }
      : null,
    offer: row.offer_id && row.offer_status
      ? {
          id: row.offer_id,
          status: row.offer_status,
          employmentType: row.offer_employment_type,
          salary: row.offer_salary,
          currency: row.offer_currency,
          startDate: row.offer_start_date,
          workingHours: row.offer_working_hours,
          workingDays: row.offer_working_days,
          benefits: row.offer_benefits,
          additionalCompensation: row.offer_additional_compensation,
        }
      : null,
  }
}

export interface RespondToJobOfferInput {
  referenceCode: string
  email: string
  decision: 'accepted' | 'declined'
  declineReason?: OfferDeclineReason
  declineNotes?: string
}

const RESPONSE_ERROR_MESSAGES: Array<[string, string]> = [
  ['NOT_FOUND', 'No application matches that reference number and email address.'],
  ['NO_OFFER', 'No job offer is available for this application.'],
  ['OFFER_NOT_AVAILABLE', 'This job offer is no longer available.'],
  ['ALREADY_RESPONDED', 'This job offer has already been answered. Refresh to see its current status.'],
  ['INVALID_DECISION', 'Choose whether to accept or decline the offer.'],
  ['DECLINE_REASON_REQUIRED', 'Choose a reason for declining the offer.'],
  ['INVALID_DECLINE_REASON', 'Choose one of the available decline reasons.'],
  ['INVALID_DECLINE_DETAILS', 'Decline details can only be sent when declining an offer.'],
]

function responseError(message: string): Error {
  const match = RESPONSE_ERROR_MESSAGES.find(([code]) => message.includes(code))
  return new Error(match?.[1] ?? 'We couldn’t record your response. Please try again.')
}

export async function respondToJobOffer(input: RespondToJobOfferInput): Promise<'accepted' | 'declined'> {
  const referenceCode = input.referenceCode.trim()
  const email = normalizeEmail(input.email)
  if (!referenceCode || !email) throw new Error('Enter your reference number and email address again.')

  const reason = input.declineReason?.trim()
  if (input.decision === 'declined' && !reason) {
    throw new Error('Choose a reason for declining the offer.')
  }
  if (reason && !OFFER_DECLINE_REASONS.includes(reason as OfferDeclineReason)) {
    throw new Error('Choose one of the available decline reasons.')
  }

  const { data, error } = await supabase.rpc('respond_to_job_offer', {
    p_reference_code: referenceCode,
    p_email: email,
    p_decision: input.decision,
    p_decline_reason: input.decision === 'declined' ? reason : undefined,
    p_decline_notes: input.decision === 'declined' ? input.declineNotes?.trim() || undefined : undefined,
  })

  if (error) throw responseError(error.message)
  if (data !== 'accepted' && data !== 'declined') {
    throw new Error('Your response was received, but its status could not be confirmed.')
  }
  return data
}
