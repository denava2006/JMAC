import { supabase } from '@/lib/supabase'

/**
 * Interview management — the two-round process between screening and hiring.
 *
 * The database enforces several ownership and assignment rules:
 *   - interviews_insert_owner: you self-assign; a final interview can only be
 *     inserted by the application's final_interviewer_id.
 *   - protect_final_interviewer_assignment: the final interviewer must be an
 *     active hr_manager/admin.
 *   - protect_interview_ownership: only the final interviewer may set the
 *     application to 'hired'; only the failing interviewer may reject from
 *     interview_scheduled.
 * It does not enforce the complete transition graph. These client guards make
 * the normal UI fail safely, while transactional DB enforcement remains an
 * explicit follow-up.
 */

export interface InterviewRecord {
  id: string
  interviewType: string
  status: string
  scheduledAt: string
  mode: string | null
  location: string | null
  meetingLink: string | null
  interviewerId: string | null
  remarks: string | null
  interviewNotes: string | null
  finalRemarks: string | null
  rejectionReason: string | null
}

export interface InterviewApplication {
  id: string
  status: string
  applicantName: string
  email: string
  phone: string | null
  positionTitle: string
  department: string | null
  reviewedById: string | null
  finalInterviewerId: string | null
  createdAt: string
  interviews: InterviewRecord[]
}

const SELECT = `
  id, status, reviewed_by, final_interviewer_id, created_at,
  applicants (first_name, middle_name, last_name, email, phone),
  job_postings (positions (title), departments (name)),
  interviews (id, interview_type, status, scheduled_at, mode, location, meeting_link, interviewer_id, remarks, interview_notes, final_remarks, rejection_reason)
`

interface JoinedInterview {
  id: string
  interview_type: string
  status: string
  scheduled_at: string
  mode: string | null
  location: string | null
  meeting_link: string | null
  interviewer_id: string | null
  remarks: string | null
  interview_notes: string | null
  final_remarks: string | null
  rejection_reason: string | null
}

interface JoinedRow {
  id: string
  status: string
  reviewed_by: string | null
  final_interviewer_id: string | null
  created_at: string
  applicants: {
    first_name: string
    middle_name: string | null
    last_name: string
    email: string
    phone: string | null
  } | null
  job_postings: {
    positions: { title: string } | null
    departments: { name: string } | null
  } | null
  interviews: JoinedInterview[] | null
}

function toInterview(i: JoinedInterview): InterviewRecord {
  return {
    id: i.id,
    interviewType: i.interview_type,
    status: i.status,
    scheduledAt: i.scheduled_at,
    mode: i.mode,
    location: i.location,
    meetingLink: i.meeting_link,
    interviewerId: i.interviewer_id,
    remarks: i.remarks,
    interviewNotes: i.interview_notes,
    finalRemarks: i.final_remarks,
    rejectionReason: i.rejection_reason,
  }
}

function toApp(row: JoinedRow): InterviewApplication {
  const a = row.applicants
  const name = [a?.first_name, a?.middle_name, a?.last_name].filter(Boolean).join(' ')
  return {
    id: row.id,
    status: row.status,
    applicantName: name || 'Unknown applicant',
    email: a?.email ?? '—',
    phone: a?.phone ?? null,
    positionTitle: row.job_postings?.positions?.title ?? 'Untitled position',
    department: row.job_postings?.departments?.name ?? null,
    reviewedById: row.reviewed_by,
    finalInterviewerId: row.final_interviewer_id,
    createdAt: row.created_at,
    interviews: (row.interviews ?? []).map(toInterview),
  }
}

export function getInterviewByStage(interviews: InterviewRecord[], stage: 'initial' | 'final'): InterviewRecord | null {
  return interviews.find((i) => i.interviewType === stage) ?? null
}

export async function fetchInterviewQueue(): Promise<InterviewApplication[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(SELECT)
    .in('status', ['qualified', 'interview_scheduled', 'hired', 'rejected'])
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as JoinedRow[]).map(toApp)
}

/**
 * Whose interview queue an application belongs in. Presentation only — the DB
 * still enforces every action.
 *   - admin: everything.
 *   - hr_manager: applications handed to them for the final round.
 *   - hr_staff: applications not yet handed off.
 * Applications rejected during screening (no interview ever held) are dropped.
 */
export function scopeInterviewQueue(
  rows: InterviewApplication[],
  role: string | undefined,
  profileId: string | undefined
): InterviewApplication[] {
  if (!profileId || !role || !['admin', 'hr_manager', 'hr_staff'].includes(role)) return []

  return rows
    .filter((r) => r.status !== 'rejected' || r.interviews.length > 0)
    .filter((r) => {
      if (role === 'admin') return true
      if (role === 'hr_manager') return r.finalInterviewerId === profileId
      return r.finalInterviewerId === null
    })
}

export interface InterviewStats {
  scheduledCount: number
  hiredCount: number
  rejectedCount: number
}

export async function fetchInterviewStats(): Promise<InterviewStats> {
  const countInterviews = async (status: 'scheduled' | 'failed'): Promise<number> => {
    const { count, error } = await supabase
      .from('interviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    if (error) throw new Error(error.message)
    return count ?? 0
  }
  const hiredCountQuery = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'hired')
    if (error) throw new Error(error.message)
    return count ?? 0
  }
  const [scheduledCount, hiredCount, rejectedCount] = await Promise.all([
    countInterviews('scheduled'),
    hiredCountQuery(),
    countInterviews('failed'),
  ])
  return { scheduledCount, hiredCount, rejectedCount }
}

export interface FinalInterviewer {
  id: string
  fullName: string
}

/**
 * Eligible final interviewers, via the `eligible_final_interviewers` RPC
 * (migration 0001).
 *
 * Reading `profiles` directly cannot work here: it is a security-invoker view,
 * so the query returned zero rows for HR Staff — precisely the role that runs
 * the initial round and has to nominate a manager. The RPC is SECURITY DEFINER,
 * demands `interview.manage`, exposes only id and name, and returns exactly the
 * set `protect_final_interviewer_assignment` accepts, so the picker cannot
 * offer someone the database will then reject.
 */
export async function fetchFinalInterviewers(): Promise<FinalInterviewer[]> {
  const { data, error } = await supabase.rpc('eligible_final_interviewers')
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; full_name: string | null }[]).map((row) => ({
    id: row.id,
    fullName: row.full_name ?? 'HR Manager',
  }))
}

export interface InterviewLocationOption {
  /** Stored on interviews.location, which is text — there is no location_id. */
  label: string
}

const MEETING_HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

/**
 * Real branch/work-location pairs, labelled "Branch · Location".
 *
 * `interviews.location` is free text, but the places an interview can actually
 * happen are already in the database, so offering the list beats letting
 * someone type a room name that means nothing to the applicant. Both tables are
 * staff-readable (`branches_read`, `work_locations_staff_select`), so this
 * needs no policy change.
 */
export async function fetchInterviewLocations(): Promise<InterviewLocationOption[]> {
  const { data, error } = await supabase
    .from('work_locations')
    .select('name, is_active, branches (name)')
    .eq('is_active', true)
    .order('name')
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as { name: string; branches: { name: string } | null }[]
  return rows
    .map((row) => ({ label: row.branches?.name ? `${row.branches.name} · ${row.name}` : row.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

async function interviewerId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  const id = data.user?.id
  if (!id) throw new Error('Your session has expired. Sign in again to manage interviews.')
  return id
}

function trimmed(value: string | undefined): string | null {
  return value?.trim() || null
}

/**
 * A meeting link has to be something the applicant can actually join: an https
 * URL with a real host. Plain text ("Google Meet"), an http link, or a
 * hostless value like `https://localhost` would all be sent to the applicant
 * as their only way into the interview.
 */
export function isMeetingUrl(value: string): boolean {
  const normalized = value.trim()
  if (!normalized || /\s/.test(normalized)) return false

  try {
    const url = new URL(normalized)
    return url.protocol === 'https:' && MEETING_HOSTNAME_PATTERN.test(url.hostname)
  } catch {
    return false
  }
}

function assertOneUpdated(data: { id: string }[] | null, message: string): void {
  if (!data || data.length !== 1) throw new Error(message)
}

async function writeHistory(entry: {
  application_id: string
  event: string
  actor_id: string
  notes?: string | null
}): Promise<void> {
  const { error } = await supabase.from('application_history').insert(entry)
  if (error) throw new Error(error.message)
}

export interface ScheduleInterviewInput {
  applicationId: string
  stage: 'initial' | 'final'
  scheduledAt: string
  mode: 'online' | 'face_to_face'
  meetingLink?: string
  location?: string
  notes?: string
}

export async function scheduleInterview(input: ScheduleInterviewInput): Promise<void> {
  const when = new Date(input.scheduledAt)
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    throw new Error('Choose an interview time in the future.')
  }

  const meetingLink = trimmed(input.meetingLink)
  const location = trimmed(input.location)
  if (input.mode === 'online' && (!meetingLink || !isMeetingUrl(meetingLink))) {
    throw new Error('Enter a valid https meeting link, for example https://meet.google.com/abc-defg.')
  }
  if (input.mode === 'face_to_face' && !location) {
    throw new Error('Choose the branch and work location for this interview.')
  }

  const me = await interviewerId()
  const { error: insertError } = await supabase.from('interviews').insert({
    application_id: input.applicationId,
    interview_type: input.stage,
    scheduled_at: when.toISOString(),
    interviewer_id: me,
    mode: input.mode,
    meeting_link: input.mode === 'online' ? meetingLink : null,
    location: input.mode === 'face_to_face' ? location : null,
    remarks: trimmed(input.notes),
    status: 'scheduled',
  })
  if (insertError) throw new Error(insertError.message)

  // The initial interview is what moves the application into the interview
  // stage; the final round happens while it is already there.
  if (input.stage === 'initial') {
    const { data: updated, error: appError } = await supabase
      .from('applications')
      .update({ status: 'interview_scheduled' })
      .eq('id', input.applicationId)
      .eq('status', 'qualified')
      .select('id')
    if (appError) throw new Error(appError.message)
    assertOneUpdated(updated, 'This applicant is no longer waiting for an initial interview. Refresh and try again.')
  }

  await writeHistory({
    application_id: input.applicationId,
    event: input.stage === 'initial' ? 'initial_interview_scheduled' : 'final_interview_scheduled',
    actor_id: me,
  })
}

export interface InitialEvaluationInput {
  interviewId: string
  applicationId: string
  decision: 'passed' | 'failed'
  notes?: string
  rejectionReason?: string
  /** Required on pass: the HR Manager/admin who runs the final round. */
  finalInterviewerId?: string
}

export async function submitInitialEvaluation(input: InitialEvaluationInput): Promise<void> {
  const rejectionReason = trimmed(input.rejectionReason)
  if (input.decision === 'failed' && !rejectionReason) {
    throw new Error('Give a reason for rejecting this applicant.')
  }
  if (input.decision === 'passed' && !input.finalInterviewerId) {
    throw new Error('Choose an HR Manager to run the final interview.')
  }

  const me = await interviewerId()
  const { data: updatedInterview, error: interviewError } = await supabase
    .from('interviews')
    .update({
      status: input.decision,
      interview_notes: trimmed(input.notes),
      rejection_reason: input.decision === 'failed' ? rejectionReason : null,
    })
    .eq('id', input.interviewId)
    .eq('application_id', input.applicationId)
    .eq('interview_type', 'initial')
    .eq('status', 'scheduled')
    .select('id')
  if (interviewError) throw new Error(interviewError.message)
  assertOneUpdated(updatedInterview, 'This initial interview has already been evaluated. Refresh to see its result.')

  if (input.decision === 'failed') {
    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update({ status: 'rejected', rejection_reason: rejectionReason })
      .eq('id', input.applicationId)
      .eq('status', 'interview_scheduled')
      .select('id')
    if (error) throw new Error(error.message)
    assertOneUpdated(updatedApplication, 'This application has already moved to another stage. Refresh and try again.')
    await writeHistory({
      application_id: input.applicationId,
      event: 'initial_interview_rejected',
      notes: rejectionReason,
      actor_id: me,
    })
    return
  }

  const { data: updatedApplication, error } = await supabase
    .from('applications')
    .update({ final_interviewer_id: input.finalInterviewerId })
    .eq('id', input.applicationId)
    .eq('status', 'interview_scheduled')
    .is('final_interviewer_id', null)
    .select('id')
  if (error) throw new Error(error.message)
  assertOneUpdated(updatedApplication, 'This applicant has already been assigned for a final interview. Refresh and try again.')
  await writeHistory({
    application_id: input.applicationId,
    event: 'initial_interview_passed',
    actor_id: me,
  })
}

export interface FinalEvaluationInput {
  interviewId: string
  applicationId: string
  decision: 'passed' | 'failed'
  notes?: string
  rejectionReason?: string
}

export async function submitFinalEvaluation(input: FinalEvaluationInput): Promise<void> {
  const rejectionReason = trimmed(input.rejectionReason)
  if (input.decision === 'failed' && !rejectionReason) {
    throw new Error('Give a reason for rejecting this applicant.')
  }

  const me = await interviewerId()
  const { data: updatedInterview, error: interviewError } = await supabase
    .from('interviews')
    .update({
      status: input.decision,
      final_remarks: trimmed(input.notes),
      rejection_reason: input.decision === 'failed' ? rejectionReason : null,
    })
    .eq('id', input.interviewId)
    .eq('application_id', input.applicationId)
    .eq('interview_type', 'final')
    .eq('status', 'scheduled')
    .select('id')
  if (interviewError) throw new Error(interviewError.message)
  assertOneUpdated(updatedInterview, 'This final interview has already been evaluated. Refresh to see its result.')

  if (input.decision === 'failed') {
    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update({ status: 'rejected', rejection_reason: rejectionReason })
      .eq('id', input.applicationId)
      .eq('status', 'interview_scheduled')
      .select('id')
    if (error) throw new Error(error.message)
    assertOneUpdated(updatedApplication, 'This application has already moved to another stage. Refresh and try again.')
    await writeHistory({
      application_id: input.applicationId,
      event: 'final_interview_rejected',
      notes: rejectionReason,
      actor_id: me,
    })
    return
  }

  const { data: updatedApplication, error } = await supabase
    .from('applications')
    .update({ status: 'hired' })
    .eq('id', input.applicationId)
    .eq('status', 'interview_scheduled')
    .select('id')
  if (error) throw new Error(error.message)
  assertOneUpdated(updatedApplication, 'This application has already moved to another stage. Refresh and try again.')
  await writeHistory({
    application_id: input.applicationId,
    event: 'hired',
    actor_id: me,
  })
}

export const interviewQueueQueryKey = ['people', 'interview-queue'] as const
export const interviewStatsQueryKey = ['people', 'interview-stats'] as const
