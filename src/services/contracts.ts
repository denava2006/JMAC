import { supabase } from '@/lib/supabase'

/**
 * Employment contracts — the stage between an accepted job offer and deployment.
 *
 * Every write goes through a permission-scoped RPC from migration 0003
 * (`generate_employment_contract`, `mark_contract_printed`,
 * `record_contract_signing`). The client holds SELECT only, so it cannot invent
 * a signed contract, skip the offer, or restate the start date — the database
 * derives that from the offer the applicant actually accepted.
 *
 * The state order is draft -> printed -> signed, enforced server-side.
 */

export type ContractStatus = 'draft' | 'printed' | 'signed'

export interface ContractRecord {
  id: string
  jobOfferId: string
  status: ContractStatus
  startDate: string | null
  signedAt: string | null
  contractFileUrl: string | null
  terms: string | null
  companyPolicies: string | null
  additionalNotes: string | null
  signingNotes: string | null
}

interface ContractRow {
  id: string
  job_offer_id: string
  status: ContractStatus
  start_date: string | null
  signed_at: string | null
  contract_file_url: string | null
  terms: string | null
  company_policies: string | null
  additional_notes: string | null
  signing_notes: string | null
}

function toContract(row: ContractRow): ContractRecord {
  return {
    id: row.id,
    jobOfferId: row.job_offer_id,
    status: row.status,
    startDate: row.start_date,
    signedAt: row.signed_at,
    contractFileUrl: row.contract_file_url,
    terms: row.terms,
    companyPolicies: row.company_policies,
    additionalNotes: row.additional_notes,
    signingNotes: row.signing_notes,
  }
}

/**
 * The contract for an application's accepted offer, if one has been generated.
 *
 * Contracts hang off `job_offers`, not `applications`, so this reads through the
 * offer. A declined offer can be followed by a revision, so the accepted offer is
 * the only one a contract can belong to.
 */
export async function fetchContractForApplication(applicationId: string): Promise<ContractRecord | null> {
  const { data, error } = await supabase
    .from('employment_contracts')
    .select(
      'id, job_offer_id, status, start_date, signed_at, contract_file_url, terms, company_policies, additional_notes, signing_notes, job_offers!inner(application_id, status)'
    )
    .eq('job_offers.application_id', applicationId)
    .eq('job_offers.status', 'accepted')
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toContract(data as unknown as ContractRow) : null
}

const CONTRACT_ERROR_MESSAGES: [string, string][] = [
  ['CONTRACT_NOT_AUTHORIZED', 'You are not allowed to manage employment contracts.'],
  ['CONTRACT_APPLICATION_REQUIRED', 'This application is no longer available.'],
  ['CONTRACT_APPLICATION_NOT_FOUND', 'This application no longer exists.'],
  ['CONTRACT_OFFER_NOT_ACCEPTED', 'The applicant has to accept a job offer before a contract can be prepared.'],
  ['CONTRACT_NOT_FOUND', 'That contract no longer exists.'],
  ['CONTRACT_ALREADY_SIGNED', 'This contract has already been signed.'],
  ['CONTRACT_NOT_ISSUED', 'Issue the contract for signing before recording a signed copy.'],
  ['CONTRACT_FILE_REQUIRED', 'Attach the signed contract copy.'],
]

function contractError(message: string, fallback: string): Error {
  const match = CONTRACT_ERROR_MESSAGES.find(([code]) => message.includes(code))
  return new Error(match?.[1] ?? fallback)
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export interface GenerateContractInput {
  applicationId: string
  terms?: string
  companyPolicies?: string
  additionalNotes?: string
}

/** Creates the draft contract from the accepted offer. Re-running before the
 *  contract is signed refreshes its wording instead of creating a second one. */
export async function generateContract(input: GenerateContractInput): Promise<string> {
  if (!input.applicationId.trim()) throw new Error('This application is no longer available.')

  const { data, error } = await supabase.rpc('generate_employment_contract', {
    p_application_id: input.applicationId,
    p_terms: optionalText(input.terms),
    p_company_policies: optionalText(input.companyPolicies),
    p_additional_notes: optionalText(input.additionalNotes),
  })
  if (error) throw contractError(error.message, 'Could not prepare the contract. Please try again.')
  if (!data) throw new Error('The contract was prepared, but its reference could not be read.')
  return data as string
}

/** draft -> printed: the copy handed to the applicant for signature. */
export async function markContractPrinted(contractId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_contract_printed', { p_contract_id: contractId })
  if (error) throw contractError(error.message, 'Could not issue the contract. Please try again.')
}

const ALLOWED_CONTRACT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_CONTRACT_BYTES = 10 * 1024 * 1024

export function validateSignedContractFile(file: File): string | null {
  if (!ALLOWED_CONTRACT_TYPES.includes(file.type)) {
    return 'Only PDF, JPG, or PNG files are accepted.'
  }
  if (file.size > MAX_CONTRACT_BYTES) {
    return 'File is too large — the maximum size is 10 MB.'
  }
  return null
}

export interface RecordSigningInput {
  contractId: string
  file: File
  signingNotes?: string
}

/**
 * Uploads the signed copy, then records the signature.
 *
 * Upload first: a contract row marked signed with no retrievable file would be
 * an assertion rather than evidence, and the database rejects it anyway. The
 * cost is that a failure between the two steps leaves an unreferenced object in
 * the private `contracts` bucket — harmless, staff-only, and preferable to the
 * reverse. There is no client delete policy on that bucket, so cleanup of such
 * orphans is an operational task, not something this code can do.
 */
export async function recordContractSigning(input: RecordSigningInput): Promise<void> {
  const fileError = validateSignedContractFile(input.file)
  if (fileError) throw new Error(fileError)

  const extension = input.file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
  const path = `${input.contractId}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from('contracts').upload(path, input.file, {
    contentType: input.file.type,
    upsert: false,
  })
  if (uploadError) throw new Error('Could not upload the signed contract. Please try again.')

  const { error } = await supabase.rpc('record_contract_signing', {
    p_contract_id: input.contractId,
    p_file_path: path,
    p_signing_notes: optionalText(input.signingNotes),
  })
  if (error) throw contractError(error.message, 'Could not record the signing. Please try again.')
}

/** Signed copies live in a private bucket, so viewing one needs a short-lived
 *  signed URL rather than a public link. */
export async function signedContractUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('contracts').createSignedUrl(path, 300)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export const contractQueryKey = (applicationId: string) => ['people', 'contract', applicationId] as const
