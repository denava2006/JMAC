import { supabase } from '@/lib/supabase'
import type { JobEmploymentType } from '@/lib/jobPostingLabels'

/**
 * Job postings — HR Staff's side of recruitment.
 *
 * Writes are gated by RLS on is_hr_staff_or_admin() (has_permission
 * ('employee.create')). The same table the public careers page reads from: a
 * posting HR publishes here becomes visible at /careers the moment its status
 * is 'open', which is the whole point of one platform rather than two.
 *
 * job_postings has no title column — the title is the joined position's. It
 * also carries both department_id and position_id, and a position already
 * belongs to a department, so the create form derives the department from the
 * chosen position rather than asking twice.
 */

export interface JobPosting {
  id: string
  title: string
  department: string | null
  positionId: string
  description: string
  requirements: string | null
  employmentType: string
  vacancies: number
  status: string
  datePosted: string | null
  closingDate: string | null
  createdAt: string
}

const SELECT =
  'id, position_id, description, requirements, employment_type, vacancies, status, date_posted, closing_date, created_at, positions(title, department_id), departments(name)'

interface JoinedRow {
  id: string
  position_id: string
  description: string
  requirements: string | null
  employment_type: string
  vacancies: number
  status: string
  date_posted: string | null
  closing_date: string | null
  created_at: string
  positions: { title: string; department_id: string } | null
  departments: { name: string } | null
}

function toJobPosting(row: JoinedRow): JobPosting {
  return {
    id: row.id,
    title: row.positions?.title ?? 'Untitled posting',
    department: row.departments?.name ?? null,
    positionId: row.position_id,
    description: row.description,
    requirements: row.requirements,
    employmentType: row.employment_type,
    vacancies: row.vacancies,
    status: row.status,
    datePosted: row.date_posted,
    closingDate: row.closing_date,
    createdAt: row.created_at,
  }
}

export async function fetchJobPostings(): Promise<JobPosting[]> {
  const { data, error } = await supabase
    .from('job_postings')
    .select(SELECT)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as JoinedRow[]).map(toJobPosting)
}

export interface PositionOption {
  id: string
  title: string
  departmentId: string
  department: string
}

export async function fetchPositionOptions(): Promise<PositionOption[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, department_id, departments(name)')
    .order('title')
  if (error) throw new Error(error.message)
  return (data as unknown as Array<{ id: string; title: string; department_id: string; departments: { name: string } | null }>).map(
    (row) => ({
      id: row.id,
      title: row.title,
      departmentId: row.department_id,
      department: row.departments?.name ?? '',
    })
  )
}

export interface JobPostingInput {
  positionId: string
  departmentId: string
  description: string
  requirements: string
  employmentType: JobEmploymentType
  vacancies: number
  closingDate: string | null
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Your session has expired. Sign in again to post a job.')
  return id
}

export async function createJobPosting(input: JobPostingInput): Promise<void> {
  // Created as a draft: a posting is not public until HR explicitly publishes
  // it, so a half-written one never leaks to /careers. posted_by records the
  // author — its database default is null, so it must be set here or the
  // posting loses who created it.
  const { error } = await supabase.from('job_postings').insert({
    position_id: input.positionId,
    department_id: input.departmentId,
    description: input.description,
    requirements: input.requirements || null,
    employment_type: input.employmentType,
    vacancies: input.vacancies,
    closing_date: input.closingDate,
    status: 'draft',
    posted_by: await currentUserId(),
  })
  if (error) throw new Error(error.message)
}

export async function updateJobPosting(id: string, input: JobPostingInput): Promise<void> {
  const { error } = await supabase
    .from('job_postings')
    .update({
      position_id: input.positionId,
      department_id: input.departmentId,
      description: input.description,
      requirements: input.requirements || null,
      employment_type: input.employmentType,
      vacancies: input.vacancies,
      closing_date: input.closingDate,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function publishJobPosting(id: string): Promise<void> {
  const { error } = await supabase
    .from('job_postings')
    .update({ status: 'open', date_posted: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function closeJobPosting(id: string): Promise<void> {
  const { error } = await supabase.from('job_postings').update({ status: 'closed' }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteJobPosting(id: string): Promise<void> {
  const { error } = await supabase.from('job_postings').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export const jobPostingsQueryKey = ['people', 'job-postings'] as const
export const positionOptionsQueryKey = ['people', 'position-options'] as const
