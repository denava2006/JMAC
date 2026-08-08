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
  supportingDocumentUrl: string | null
  status: string
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

const SELECT =
  'id, employee_id, leave_type_id, start_date, end_date, days_requested, reason, supporting_document_url, status, reviewed_by, reviewed_at, rejection_reason, created_at, employees(employee_number, first_name, middle_name, last_name, suffix), leave_types(name)'

interface JoinedRow {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  supporting_document_url: string | null
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
    supportingDocumentUrl: row.supporting_document_url,
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

/** Two inclusive date ranges overlap when each begins on or before the other
 *  ends. Ported from HRMS leaveCalculations. */
function dateRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

/** Every ISO date from start to end inclusive, in local time. */
function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const cursor = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  while (cursor.getTime() <= end.getTime()) {
    dates.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    )
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
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
  // A person cannot be on two leaves at once. leave_requests has no exclusion
  // constraint, so we reject a range that overlaps any of the employee's own
  // pending or approved requests before inserting — the HRMS check, reused.
  const { data: existing, error: existingError } = await supabase
    .from('leave_requests')
    .select('start_date, end_date')
    .eq('employee_id', input.employeeId)
    .in('status', ['pending', 'approved'])
  if (existingError) throw new Error(existingError.message)
  const overlaps = (existing ?? []).some((r) =>
    dateRangesOverlap(input.startDate, input.endDate, r.start_date, r.end_date)
  )
  if (overlaps) {
    throw new Error('This employee already has a pending or approved leave request that overlaps these dates.')
  }

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
  const reviewer = await reviewerId()

  // Read the request first: we need its employee, type, dates and day count to
  // check the balance and post the on-leave attendance, and to fail fast if it
  // is no longer pending.
  const { data: request, error: requestError } = await supabase
    .from('leave_requests')
    .select('employee_id, leave_type_id, start_date, end_date, days_requested, status')
    .eq('id', id)
    .single()
  if (requestError) throw new Error(requestError.message)
  if (request.status !== 'pending') {
    throw new Error('Only a pending request can be approved.')
  }

  // The balance must exist and cover the request before it is approved —
  // otherwise Payroll and Attendance would credit leave the employee has not
  // earned. The year comes from the leave's start date.
  const year = new Date(`${request.start_date}T00:00:00`).getFullYear()
  const { data: balance, error: balanceError } = await supabase
    .from('leave_balances')
    .select('id, used_credits, remaining_credits')
    .eq('employee_id', request.employee_id)
    .eq('leave_type_id', request.leave_type_id)
    .eq('year', year)
    .maybeSingle()
  if (balanceError) throw new Error(balanceError.message)
  if (!balance) {
    throw new Error('No leave balance exists for this employee and leave type this year.')
  }
  const remaining = Number(balance.remaining_credits)
  const days = Number(request.days_requested)
  if (remaining < days) {
    throw new Error(`Insufficient leave credits: ${remaining} remaining, ${days} requested.`)
  }

  // Flip the status first, guarded on it still being pending. If a second
  // reviewer approved or rejected it in the meantime this updates no rows and
  // we stop here — before deducting the balance a second time. The DB trigger
  // recomputes the employee's employment_status from this change.
  const { data: updated, error: updateError } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
  if (updateError) throw new Error(updateError.message)
  if (!updated || updated.length !== 1) {
    throw new Error('This request was already reviewed by someone else.')
  }

  // Deduct the credits and mark every day of the range as on-leave so
  // Attendance and Payroll see the absence.
  const { error: deductError } = await supabase
    .from('leave_balances')
    .update({ used_credits: Number(balance.used_credits) + days })
    .eq('id', balance.id)
  if (deductError) throw new Error(deductError.message)

  const { error: attendanceError } = await supabase.from('attendance_records').upsert(
    enumerateDates(request.start_date, request.end_date).map((date) => ({
      employee_id: request.employee_id,
      attendance_date: date,
      status: 'on_leave' as const,
    })),
    { onConflict: 'employee_id,attendance_date' }
  )
  if (attendanceError) throw new Error(attendanceError.message)

  await supabase.from('audit_logs').insert({
    actor_id: reviewer,
    action: 'Leave Approved',
    table_name: 'leave_requests',
    record_id: id,
    old_data: { status: 'pending' },
    new_data: { status: 'approved', days_deducted: days, remaining_after: remaining - days },
  })
}

export async function rejectLeaveRequest(id: string, reason: string): Promise<void> {
  const reviewer = await reviewerId()

  // Guarded on pending, same as approve: two reviewers working from stale
  // queues must not be able to flip an already-decided request.
  const { data: updated, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
  if (error) throw new Error(error.message)
  if (!updated || updated.length !== 1) {
    throw new Error('This request was already reviewed by someone else.')
  }

  await supabase.from('audit_logs').insert({
    actor_id: reviewer,
    action: 'Leave Rejected',
    table_name: 'leave_requests',
    record_id: id,
    old_data: { status: 'pending' },
    new_data: { status: 'rejected', reason },
  })
}

export const leaveRequestsQueryKey = ['people', 'leave-requests'] as const
export const leaveTypesQueryKey = ['people', 'leave-types'] as const
export const employeeOptionsQueryKey = ['people', 'employee-options'] as const
