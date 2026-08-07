import { supabase } from '@/lib/supabase'

/**
 * Public job postings for the careers section.
 *
 * Anything this can read is already open — the `anon_view_open_postings`
 * policy restricts anonymous select to `status = 'open'`, so there is no
 * client-side status filter here and adding one would be a second, weaker
 * copy of the rule.
 *
 * Shape follows HRMS's usePublicCareers.ts. Note `job_postings` has no
 * `title` column: the title comes from `positions.title` through the join.
 * HRMS dropped that column and jmac-suite inherited the corrected shape.
 */
export interface PublicJobPosting {
  id: string
  description: string
  requirements: string | null
  employmentType: string
  vacancies: number
  datePosted: string | null
  closingDate: string | null
  title: string
  department: string | null
}

// No branch join: job_postings carries no branch_id in this schema, and
// `branches` grants read to `authenticated` only -- an anonymous visitor
// could not resolve the name even if the foreign key existed.
const SELECT =
  'id, description, requirements, employment_type, vacancies, date_posted, closing_date, departments(name), positions(title)'

interface PostingRow {
  id: string
  description: string
  requirements: string | null
  employment_type: string
  vacancies: number
  date_posted: string | null
  closing_date: string | null
  departments: { name: string } | null
  positions: { title: string } | null
}

function toPosting(row: PostingRow): PublicJobPosting {
  return {
    id: row.id,
    description: row.description,
    requirements: row.requirements,
    employmentType: row.employment_type,
    vacancies: row.vacancies,
    datePosted: row.date_posted,
    closingDate: row.closing_date,
    title: row.positions?.title ?? 'Open position',
    department: row.departments?.name ?? null,
  }
}

export async function fetchOpenPositions(): Promise<PublicJobPosting[]> {
  const { data, error } = await supabase
    .from('job_postings')
    .select(SELECT)
    .order('date_posted', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data as unknown as PostingRow[]).map(toPosting)
}

export async function fetchOpenPosition(id: string): Promise<PublicJobPosting | null> {
  const { data, error } = await supabase.from('job_postings').select(SELECT).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toPosting(data as unknown as PostingRow) : null
}

/** True once a posting's own closing date has passed, even if HR has not yet
 *  flipped its status to closed. Ported verbatim from HRMS. */
export function isPastClosingDate(closingDate: string | null): boolean {
  if (!closingDate) return false
  const today = new Date()
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return closingDate < todayIso
}

export function isAcceptingApplications(posting: Pick<PublicJobPosting, 'closingDate'>): boolean {
  return !isPastClosingDate(posting.closingDate)
}

export const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  internship: 'Internship',
}

export const openPositionsQueryKey = ['public', 'job-postings'] as const
