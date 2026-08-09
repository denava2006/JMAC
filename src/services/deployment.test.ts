import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc, from },
}))

import { deployApplicant, fetchDeploymentQueue, fetchWorkSchedules } from '@/services/deployment'

function queueChain(rows: unknown[]) {
  const chain = {
    select: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve({ data: rows, error: null })),
  }
  return chain
}

function listChain(result: { data: unknown; error: { message: string } | null }) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

function row(overrides: { offers?: unknown; deployment?: unknown } = {}) {
  return {
    id: 'app-1',
    status: 'offered',
    applicants: { first_name: 'Ada', middle_name: null, last_name: 'Applicant', email: 'ada@example.com' },
    job_postings: { positions: { title: 'Cashier' }, departments: { name: 'Sales' } },
    job_offers:
      overrides.offers ?? [
        {
          status: 'accepted',
          start_date: '2026-09-08',
          employment_type: 'regular',
          employment_contracts: { status: 'signed' },
        },
      ],
    deployment_records: overrides.deployment ?? null,
  }
}

function baseInput() {
  return {
    applicationId: 'app-1',
    branchId: 'branch-1',
    workLocationId: 'loc-1',
    workScheduleId: 'sched-1',
    reportingManager: '  Mina Manager  ',
    remarks: '   ',
  }
}

beforeEach(() => {
  rpc.mockReset()
  from.mockReset()
})

describe('deployApplicant', () => {
  it('sends the whole step to the atomic RPC and returns the record id', async () => {
    rpc.mockResolvedValue({ data: 'deployment-1', error: null })

    await expect(deployApplicant(baseInput())).resolves.toBe('deployment-1')

    expect(rpc).toHaveBeenCalledWith('deploy_applicant', {
      p_application_id: 'app-1',
      p_branch_id: 'branch-1',
      p_work_location_id: 'loc-1',
      p_work_schedule_id: 'sched-1',
      p_reporting_manager: 'Mina Manager',
      p_reporting_time: undefined,
      // Whitespace-only optional text is omitted, not stored as '   '.
      p_remarks: undefined,
    })
    // The deployment date is the accepted offer's start date, derived by the
    // database — the client must not send one.
    expect(rpc.mock.calls[0]![1]).not.toHaveProperty('p_deployment_date')
  })

  it('explains that the contract has to be signed first', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'DEPLOY_CONTRACT_NOT_SIGNED' } })
    await expect(deployApplicant(baseInput())).rejects.toThrow(/signed employment contract/i)
  })

  it('explains a cross-branch work location', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'DEPLOY_LOCATION_BRANCH_MISMATCH' } })
    await expect(deployApplicant(baseInput())).rejects.toThrow(/different branch/i)
  })

  it('maps the trigger message when the API is called without a signed contract', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'A signed employment contract is required before deployment.' },
    })
    await expect(deployApplicant(baseInput())).rejects.toThrow(/signed employment contract/i)
  })

  it('validates the application and branch before calling the RPC', async () => {
    await expect(deployApplicant({ ...baseInput(), branchId: '' })).rejects.toThrow(/branch/i)
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('fetchDeploymentQueue', () => {
  it('marks an accepted offer with a signed contract as ready', async () => {
    from.mockReturnValue(queueChain([row()]))
    const rows = await fetchDeploymentQueue()
    expect(rows[0]).toMatchObject({
      startDate: '2026-09-08',
      employmentType: 'regular',
      contractSigned: true,
      deployedAt: null,
    })
  })

  // Deployment must stay locked until the signed copy is on file.
  it('does not mark an unsigned contract as ready', async () => {
    from.mockReturnValue(
      queueChain([
        row({
          offers: [
            {
              status: 'accepted',
              start_date: '2026-09-08',
              employment_type: 'regular',
              employment_contracts: { status: 'printed' },
            },
          ],
        }),
      ])
    )
    const rows = await fetchDeploymentQueue()
    expect(rows[0]?.contractSigned).toBe(false)
  })

  it('reads the deployed date from a single-object embed', async () => {
    from.mockReturnValue(queueChain([row({ deployment: { deployment_date: '2026-09-08' } })]))
    const rows = await fetchDeploymentQueue()
    expect(rows[0]?.deployedAt).toBe('2026-09-08')
  })

  // A pending offer is the offer stage's work, not deployment's.
  it('drops an offered applicant who has not accepted yet', async () => {
    from.mockReturnValue(
      queueChain([
        row({
          offers: [
            { status: 'pending', start_date: '2026-09-08', employment_type: 'regular', employment_contracts: null },
          ],
        }),
      ])
    )
    await expect(fetchDeploymentQueue()).resolves.toEqual([])
  })
})

describe('fetchWorkSchedules', () => {
  it('asks only for schedules matching the offer employment type', async () => {
    const query = listChain({ data: [{ id: 'sched-1', name: 'Regular Day' }], error: null })
    from.mockReturnValue(query)

    await expect(fetchWorkSchedules('regular')).resolves.toEqual([{ id: 'sched-1', name: 'Regular Day' }])
    expect(query.eq).toHaveBeenCalledWith('employment_type', 'regular')
  })
})
