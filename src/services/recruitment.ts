import { supabase } from '@/lib/supabase'
import type { JobEmploymentType } from '@/lib/jobPostingLabels'
import type { Enums } from '@/types/database.types'

/**
 * Recruitment screening — the HR side of the applicant pipeline.
 *
 * Reads and writes go through the `applications_staff_all` RLS policy (staff
 * full access). Qualify/reject are additionally guarded by the database trigger
 * `protect_application_screening`, which requires an HR Manager for the
 * submitted -> qualified|rejected transition. The UI gates on `applicant.screen`;
 * the trigger is the real boundary.
 */

export interface ApplicationRow {
  id: string
  applicantId: string
  applicantName: string
  email: string
  phone: string | null
  street: string | null
  province: string | null
  city: string | null
  barangay: string | null
  resumeUrl: string | null
  coverLetter: string | null
  positionTitle: string
  department: string | null
  employmentType: JobEmploymentType | null
  latestOfferStatus: Enums<'offer_status'> | null
  status: string
  rejectionReason: string | null
  reviewedAt: string | null
  createdAt: string
}

const SELECT = `
  id, status, rejection_reason, reviewed_at, created_at, applicant_id,
  applicants (first_name, middle_name, last_name, email, phone, address, province, city, barangay, resume_url, cover_letter),
  job_postings (employment_type, positions (title), departments (name)),
  job_offers (id, status, created_at)
`

interface JoinedRow {
  id: string
  status: string
  rejection_reason: string | null
  reviewed_at: string | null
  created_at: string
  applicant_id: string
  applicants: {
    first_name: string
    middle_name: string | null
    last_name: string
    email: string
    phone: string | null
    address: string | null
    province: string | null
    city: string | null
    barangay: string | null
    resume_url: string | null
    cover_letter: string | null
  } | null
  job_postings: {
    employment_type: JobEmploymentType
    positions: { title: string } | null
    departments: { name: string } | null
  } | null
  job_offers: Array<{
    id: string
    status: Enums<'offer_status'>
    created_at: string
  }> | null
}

function toRow(row: JoinedRow): ApplicationRow {
  const a = row.applicants
  const name = [a?.first_name, a?.middle_name, a?.last_name].filter(Boolean).join(' ')
  const latestOffer = [...(row.job_offers ?? [])].sort((left, right) =>
    right.created_at.localeCompare(left.created_at) || right.id.localeCompare(left.id)
  )[0]
  return {
    id: row.id,
    applicantId: row.applicant_id,
    applicantName: name || 'Unknown applicant',
    email: a?.email ?? '—',
    phone: a?.phone ?? null,
    street: a?.address ?? null,
    province: a?.province ?? null,
    city: a?.city ?? null,
    barangay: a?.barangay ?? null,
    resumeUrl: a?.resume_url ?? null,
    coverLetter: a?.cover_letter ?? null,
    positionTitle: row.job_postings?.positions?.title ?? 'Untitled position',
    department: row.job_postings?.departments?.name ?? null,
    employmentType: row.job_postings?.employment_type ?? null,
    latestOfferStatus: latestOffer?.status ?? null,
    status: row.status,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  }
}

export async function fetchApplications(): Promise<ApplicationRow[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(SELECT)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as JoinedRow[]).map(toRow)
}

export async function fetchApplication(id: string): Promise<ApplicationRow> {
  const { data, error } = await supabase
    .from('applications')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('This application is no longer available.')
  return toRow(data as unknown as JoinedRow)
}

export interface ApplicationStats {
  newCount: number
  qualifiedCount: number
  rejectedCount: number
}

export async function fetchApplicationStats(): Promise<ApplicationStats> {
  const countBy = async (status: 'submitted' | 'qualified' | 'rejected'): Promise<number> => {
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    if (error) throw new Error(error.message)
    return count ?? 0
  }
  const [newCount, qualifiedCount, rejectedCount] = await Promise.all([
    countBy('submitted'),
    countBy('qualified'),
    countBy('rejected'),
  ])
  return { newCount, qualifiedCount, rejectedCount }
}

async function reviewerId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Your session has expired. Sign in again to screen applications.')
  return id
}

export async function qualifyApplication(id: string): Promise<void> {
  const reviewer = await reviewerId()
  // Guarded on 'submitted': two reviewers on stale queues must not both screen
  // the same application. The DB trigger also requires an HR Manager here.
  const { data: updated, error } = await supabase
    .from('applications')
    .update({ status: 'qualified', reviewed_by: reviewer, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'submitted')
    .select('id')
  if (error) throw new Error(error.message)
  if (!updated || updated.length !== 1) {
    throw new Error('This application was already screened by someone else.')
  }
  await supabase.from('application_history').insert({ application_id: id, event: 'qualified', actor_id: reviewer })
}

export async function rejectApplication(id: string, reason: string): Promise<void> {
  const reviewer = await reviewerId()
  const { data: updated, error } = await supabase
    .from('applications')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'submitted')
    .select('id')
  if (error) throw new Error(error.message)
  if (!updated || updated.length !== 1) {
    throw new Error('This application was already screened by someone else.')
  }
  await supabase
    .from('application_history')
    .insert({ application_id: id, event: 'rejected', notes: reason, actor_id: reviewer })
}

export async function resumeSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, 300)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export const applicationsQueryKey = ['people', 'applications'] as const
export const applicationStatsQueryKey = ['people', 'application-stats'] as const
