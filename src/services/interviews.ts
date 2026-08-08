import { supabase } from '@/lib/supabase'

/**
 * Interview management — the two-round process between screening and hiring.
 *
 * The database enforces the state machine and who may act:
 *   - interviews_insert_owner: you self-assign; a final interview can only be
 *     inserted by the application's final_interviewer_id.
 *   - protect_final_interviewer_assignment: the final interviewer must be an
 *     active hr_manager/admin.
 *   - protect_interview_ownership: only the final interviewer may set the
 *     application to 'hired'; only the failing interviewer may reject from
 *     interview_scheduled.
 * The app mirrors those rules for a clean UI; the triggers are the real word.
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
  finalInterviewerId: string | null
  createdAt: string
  interviews: InterviewRecord[]
}

const SELECT = `
  id, status, final_interviewer_id, created_at,
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
 *   - otherwise (hr_staff): applications not yet handed off.
 * Applications rejected during screening (no interview ever held) are dropped.
 */
export function scopeInterviewQueue(
  rows: InterviewApplication[],
  role: string | undefined,
  profileId: string | undefined
): InterviewApplication[] {
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
  const countInterviews = async (status: string): Promise<number> => {
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

export async function fetchFinalInterviewers(): Promise<FinalInterviewer[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['hr_manager', 'admin'])
    .eq('status', 'active')
    .order('full_name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ id: r.id as string, fullName: (r.full_name as string) ?? '—' }))
}

async function interviewerId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Your session has expired. Sign in again to manage interviews.')
  return id
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
  const me = await interviewerId()
  const { error: insertError } = await supabase.from('interviews').insert({
    application_id: input.applicationId,
    interview_type: input.stage,
    scheduled_at: input.scheduledAt,
    interviewer_id: me,
    mode: input.mode,
    meeting_link: input.meetingLink || null,
    location: input.location || null,
    remarks: input.notes || null,
    status: 'scheduled',
  })
  if (insertError) throw new Error(insertError.message)

  // The initial interview is what moves the application into the interview
  // stage; the final round happens while it is already there.
  if (input.stage === 'initial') {
    const { error: appError } = await supabase
      .from('applications')
      .update({ status: 'interview_scheduled' })
      .eq('id', input.applicationId)
    if (appError) throw new Error(appError.message)
  }

  await supabase.from('application_history').insert({
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
  const me = await interviewerId()
  const { error: interviewError } = await supabase
    .from('interviews')
    .update({
      status: input.decision,
      interview_notes: input.notes || null,
      rejection_reason: input.decision === 'failed' ? input.rejectionReason || null : null,
    })
    .eq('id', input.interviewId)
  if (interviewError) throw new Error(interviewError.message)

  if (input.decision === 'failed') {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected', rejection_reason: input.rejectionReason || null })
      .eq('id', input.applicationId)
    if (error) throw new Error(error.message)
    await supabase.from('application_history').insert({
      application_id: input.applicationId,
      event: 'initial_interview_rejected',
      notes: input.rejectionReason || null,
      actor_id: me,
    })
    return
  }

  if (!input.finalInterviewerId) {
    throw new Error('Choose an HR Manager to run the final interview.')
  }
  const { error } = await supabase
    .from('applications')
    .update({ final_interviewer_id: input.finalInterviewerId })
    .eq('id', input.applicationId)
  if (error) throw new Error(error.message)
  await supabase.from('application_history').insert({
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
  const me = await interviewerId()
  const { error: interviewError } = await supabase
    .from('interviews')
    .update({
      status: input.decision,
      final_remarks: input.notes || null,
      rejection_reason: input.decision === 'failed' ? input.rejectionReason || null : null,
    })
    .eq('id', input.interviewId)
  if (interviewError) throw new Error(interviewError.message)

  if (input.decision === 'failed') {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected', rejection_reason: input.rejectionReason || null })
      .eq('id', input.applicationId)
    if (error) throw new Error(error.message)
    await supabase.from('application_history').insert({
      application_id: input.applicationId,
      event: 'final_interview_rejected',
      notes: input.rejectionReason || null,
      actor_id: me,
    })
    return
  }

  const { error } = await supabase.from('applications').update({ status: 'hired' }).eq('id', input.applicationId)
  if (error) throw new Error(error.message)
  await supabase.from('application_history').insert({
    application_id: input.applicationId,
    event: 'hired',
    actor_id: me,
  })
}

export const interviewQueueQueryKey = ['people', 'interview-queue'] as const
export const interviewStatsQueryKey = ['people', 'interview-stats'] as const
