import { supabase } from '@/lib/supabase'

/**
 * Deployment — the step that posts a hired applicant to a branch.
 *
 * Increment C reworked this: the whole step is one permission-scoped RPC
 * (`deploy_applicant`, migration 0004), and `deployment_records` is SELECT-only
 * for the client. The database, not the browser, decides:
 *   - that the applicant accepted an offer and the contract is signed
 *     (the transition trigger refuses `offered -> deployed` otherwise, so a
 *     direct API call cannot skip the process either);
 *   - the deployment date, which is the accepted offer's start date;
 *   - that the work location belongs to the chosen branch and the schedule
 *     matches the offer's employment type.
 */

/** The employment_type enum as the generated types express it. */
export type DeploymentEmploymentType = 'regular' | 'part_time'

export interface DeployableApplication {
  id: string
  applicantName: string
  email: string
  positionTitle: string
  department: string | null
  /** From the accepted offer — decides which work schedules are compatible. */
  employmentType: DeploymentEmploymentType | null
  /** The accepted offer's start date; the deployment date is this, not a choice. */
  startDate: string | null
  contractSigned: boolean
  deployedAt: string | null
}

const SELECT = `
  id, status,
  applicants (first_name, middle_name, last_name, email),
  job_postings (positions (title), departments (name)),
  job_offers (status, start_date, employment_type, employment_contracts (status)),
  deployment_records (deployment_date)
`

interface JoinedOffer {
  status: string
  start_date: string | null
  employment_type: string | null
  employment_contracts: { status: string } | { status: string }[] | null
}

interface JoinedRow {
  id: string
  status: string
  applicants: {
    first_name: string
    middle_name: string | null
    last_name: string
    email: string
  } | null
  job_postings: {
    positions: { title: string } | null
    departments: { name: string } | null
  } | null
  job_offers: JoinedOffer[] | null
  deployment_records:
    | { deployment_date: string }
    | { deployment_date: string }[]
    | null
}

/** PostgREST collapses a uniquely-keyed embed to a single object rather than an
 *  array, so both shapes have to be accepted or a present row reads as absent. */
function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function toDeployable(row: JoinedRow): DeployableApplication {
  const a = row.applicants
  const name = [a?.first_name, a?.middle_name, a?.last_name].filter(Boolean).join(' ')
  const accepted = (row.job_offers ?? []).find((offer) => offer.status === 'accepted') ?? null
  const contract = firstOf(accepted?.employment_contracts)
  return {
    id: row.id,
    applicantName: name || 'Unknown applicant',
    email: a?.email ?? '—',
    positionTitle: row.job_postings?.positions?.title ?? 'Untitled position',
    department: row.job_postings?.departments?.name ?? null,
    employmentType: (accepted?.employment_type as DeploymentEmploymentType | null) ?? null,
    startDate: accepted?.start_date ?? null,
    contractSigned: contract?.status === 'signed',
    deployedAt: firstOf(row.deployment_records)?.deployment_date ?? null,
  }
}

/**
 * Applicants at the deployment stage: those with an accepted offer awaiting
 * deployment, plus those already deployed so the page shows its own history.
 */
export async function fetchDeploymentQueue(): Promise<DeployableApplication[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(SELECT)
    .in('status', ['offered', 'deployed'])
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as JoinedRow[])
    .map(toDeployable)
    // An offered applicant who has not accepted yet is the offer stage's work,
    // not this page's.
    .filter((row) => row.deployedAt !== null || row.startDate !== null)
}

export interface LookupOption {
  id: string
  name: string
}

export async function fetchBranches(): Promise<LookupOption[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as LookupOption[]
}

export async function fetchWorkLocations(branchId: string): Promise<LookupOption[]> {
  const { data, error } = await supabase
    .from('work_locations')
    .select('id, name')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as LookupOption[]
}

/** Only schedules matching the accepted offer's employment type — the RPC and
 *  the compatibility trigger both reject anything else. */
export async function fetchWorkSchedules(employmentType: DeploymentEmploymentType): Promise<LookupOption[]> {
  const { data, error } = await supabase
    .from('work_schedules')
    .select('id, name')
    .eq('employment_type', employmentType)
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as LookupOption[]
}

/** Reporting managers come from the employee directory rather than free text.
 *  `deployment_records.reporting_manager` is a text column, so the chosen name
 *  is what gets stored. */
export async function fetchReportingManagers(): Promise<LookupOption[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .eq('employment_status', 'active')
    .order('last_name')
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; first_name: string; last_name: string }[]).map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
  }))
}

const DEPLOY_ERROR_MESSAGES: [string, string][] = [
  ['DEPLOY_NOT_AUTHORIZED', 'You are not allowed to deploy applicants.'],
  ['DEPLOY_BRANCH_REQUIRED', 'Choose the branch this employee reports to.'],
  ['DEPLOY_APPLICATION_NOT_FOUND', 'This application no longer exists.'],
  ['DEPLOY_OFFER_NOT_ACCEPTED', 'The applicant has to accept a job offer before deployment.'],
  ['DEPLOY_CONTRACT_NOT_SIGNED', 'Record the signed employment contract before deploying.'],
  ['DEPLOY_BRANCH_INVALID', 'That branch is no longer available.'],
  ['DEPLOY_LOCATION_INVALID', 'That work location is no longer available.'],
  ['DEPLOY_LOCATION_BRANCH_MISMATCH', 'That work location belongs to a different branch.'],
  ['DEPLOY_SCHEDULE_INVALID', 'That work schedule is no longer available.'],
  ['DEPLOY_SCHEDULE_MISMATCH', 'That work schedule does not match the offer employment type.'],
  ['DEPLOY_APPLICATION_STATE_INVALID', 'This applicant is no longer awaiting deployment.'],
  ['signed employment contract is required', 'Record the signed employment contract before deploying.'],
]

function deployError(message: string): Error {
  const match = DEPLOY_ERROR_MESSAGES.find(([code]) => message.includes(code))
  return new Error(match?.[1] ?? 'Could not deploy this applicant. Please try again.')
}

export interface DeployInput {
  applicationId: string
  branchId: string
  workLocationId?: string
  workScheduleId?: string
  reportingManager?: string
  reportingTime?: string
  remarks?: string
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** One transaction: the deployment record, the application status and the
 *  history entry, or none of them. */
export async function deployApplicant(input: DeployInput): Promise<string> {
  if (!input.applicationId.trim()) throw new Error('This application is no longer available.')
  if (!input.branchId.trim()) throw new Error('Choose the branch this employee reports to.')

  const { data, error } = await supabase.rpc('deploy_applicant', {
    p_application_id: input.applicationId,
    p_branch_id: input.branchId,
    p_work_location_id: input.workLocationId || undefined,
    p_work_schedule_id: input.workScheduleId || undefined,
    p_reporting_manager: optionalText(input.reportingManager),
    p_reporting_time: optionalText(input.reportingTime),
    p_remarks: optionalText(input.remarks),
  })
  if (error) throw deployError(error.message)
  if (!data) throw new Error('The applicant was deployed, but the record reference could not be read.')
  return data as string
}

export const deploymentQueueQueryKey = ['people', 'deployment-queue'] as const
