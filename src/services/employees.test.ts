import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc, from },
}))

import { createEmployeeFromApplication, fetchPendingEmployees } from '@/services/employees'

function pendingChain(rows: unknown[]) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve({ data: rows, error: null })),
  }
  return chain
}

function row(employees: unknown) {
  return {
    id: 'app-1',
    applicants: { first_name: 'Ada', middle_name: null, last_name: 'Applicant', email: 'ada@example.com' },
    job_postings: { positions: { title: 'Cashier' }, departments: { name: 'Sales' } },
    deployment_records: { deployment_date: '2026-09-09' },
    employees,
    job_offers: [{ status: 'accepted' }],
  }
}

beforeEach(() => {
  rpc.mockReset()
  from.mockReset()
})

describe('fetchPendingEmployees', () => {
  it('lists a deployed applicant with no employee record yet', async () => {
    from.mockReturnValue(pendingChain([row(null)]))

    await expect(fetchPendingEmployees()).resolves.toEqual([
      {
        applicationId: 'app-1',
        applicantName: 'Ada Applicant',
        email: 'ada@example.com',
        positionTitle: 'Cashier',
        department: 'Sales',
        deploymentDate: '2026-09-09',
      },
    ])
  })

  // The whole point of the list: someone already turned into an employee is not
  // pending, and must never be offered for creation a second time.
  it('drops an application that already has an employee', async () => {
    from.mockReturnValue(pendingChain([row([{ id: 'emp-1' }])]))
    await expect(fetchPendingEmployees()).resolves.toEqual([])
  })

  it('also drops it when the embed collapses to a single object', async () => {
    from.mockReturnValue(pendingChain([row({ id: 'emp-1' })]))
    await expect(fetchPendingEmployees()).resolves.toEqual([])
  })

  // Applications deployed before offers existed cannot be built into an employee
  // record, so offering the action would promise something that always fails.
  it('drops a legacy deployment that has no accepted offer', async () => {
    const legacy = { ...row(null), job_offers: [] }
    from.mockReturnValue(pendingChain([legacy]))
    await expect(fetchPendingEmployees()).resolves.toEqual([])
  })
})

describe('createEmployeeFromApplication', () => {
  it('calls the RPC and returns the new employee id', async () => {
    rpc.mockResolvedValue({ data: 'emp-1', error: null })

    await expect(createEmployeeFromApplication('app-1')).resolves.toBe('emp-1')
    expect(rpc).toHaveBeenCalledWith('create_employee_from_application', { p_application_id: 'app-1' })
  })

  it('explains that deployment has to happen first', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'EMPLOYEE_NOT_DEPLOYED' } })
    await expect(createEmployeeFromApplication('app-1')).rejects.toThrow(/Complete the deployment/i)
  })

  it('surfaces an authorization failure', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'EMPLOYEE_NOT_AUTHORIZED' } })
    await expect(createEmployeeFromApplication('app-1')).rejects.toThrow(/not allowed/i)
  })

  it('falls back to a generic message for an unknown failure', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await expect(createEmployeeFromApplication('app-1')).rejects.toThrow(/Could not create the employee record/i)
  })

  it('validates the application id before calling the RPC', async () => {
    await expect(createEmployeeFromApplication('  ')).rejects.toThrow(/no longer available/i)
    expect(rpc).not.toHaveBeenCalled()
  })
})
