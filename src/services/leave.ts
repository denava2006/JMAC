import { supabase } from '@/lib/supabase'
import { fullName } from '@/services/employees'

/**
 * Leave requests.
 *
 * Three RLS policies shape what the service may do:
 *   - staff (has_permission('employee.view')) may do everything — the HR view
 *   - an active employee may insert a request for themselves, pending only
 *   - an active employee may read only their own
 *
 * This service is the HR view. The write actions (file on behalf, approve,
 * reject) all go through the staff policy. Approve and reject are gated in the
 * UI on the leave.approve permission — HR Manager, not HR Staff — because the
 * staff RLS policy is deliberately broader than the intended separation of
 * duties, and the narrower rule is the product's, not the database's.
 */

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeNumber: string
  leaveType: string
  startDate: string
  endDate: string
  daysRequested: number
  reason: string | null
  status: string
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

const SELECT =
  'id, employee_id, leave_type_id, start_date, end_date, days_requested, reason, status, reviewed_by, reviewed_at, rejection_reason, created_at, employees(employee_number, first_name, middle_name, last_name, suffix), leave_types(name)'

interface JoinedRow {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  employees: {
    employee_number: string
    first_name: string
    middle_name: string | null
    last_name: string
    suffix: string | null
  } | null
  leave_types: { name: string } | null
}

function toLeaveRequest(row: JoinedRow): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employees ? fullName(row.employees) : 'Unknown employee',
    employeeNumber: row.employees?.employee_number ?? '—',
    leaveType: row.leave_types?.name ?? '—',
    startDate: row.start_date,
    endDate: row.end_date,
    daysRequested: Number(row.days_requested),
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
  }
}

export async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(SELECT)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as JoinedRow[]).map(toLeaveRequest)
}

export interface LeaveTypeOption {
  id: string
  name: string
}

export async function fetchLeaveTypes(): Promise<LeaveTypeOption[]> {
  const { data, error } = await supabase.from('leave_types').select('id, name').order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export interface EmployeeOption {
  id: string
  label: string
}

export async function fetchEmployeeOptions(): Promise<EmployeeOption[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_number, first_name, middle_name, last_name, suffix')
    .eq('employment_status', 'active')
    .order('last_name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    label: `${fullName(row)} · ${row.employee_number}`,
  }))
}

export interface FileLeaveInput {
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  daysRequested: number
  reason: string
}

export async function fileLeaveRequest(input: FileLeaveInput): Promise<void> {
  const { error } = await supabase.from('leave_requests').insert({
    employee_id: input.employeeId,
    leave_type_id: input.leaveTypeId,
    start_date: input.startDate,
    end_date: input.endDate,
    days_requested: input.daysRequested,
    reason: input.reason || null,
    status: 'pending',
  })
  if (error) throw new Error(error.message)
}

async function reviewerId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Your session has expired. Sign in again to review leave.')
  return id
}

export async function approveLeaveRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      reviewed_by: await reviewerId(),
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function rejectLeaveRequest(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      reviewed_by: await reviewerId(),
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export const leaveRequestsQueryKey = ['people', 'leave-requests'] as const
export const leaveTypesQueryKey = ['people', 'leave-types'] as const
export const employeeOptionsQueryKey = ['people', 'employee-options'] as const
