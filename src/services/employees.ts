import { supabase } from '@/lib/supabase'

/**
 * Employees.
 *
 * `employees_read_all` gates SELECT on `has_permission('employee.view')`, so
 * the People pages never filter by permission themselves — RLS decides whether
 * a row is returned at all. HR reads the whole directory; an employee reading
 * their own record is a different policy (`employees_read_self`) that returns
 * only their row from the same query.
 *
 * Joins go through the foreign keys the schema already has: department,
 * position, and branch. `position_title` is a denormalised copy kept on the
 * row, so the joined `positions.title` is preferred and it is the fallback.
 */

export interface EmployeeListRow {
  id: string
  employeeNumber: string
  fullName: string
  workEmail: string | null
  positionTitle: string
  department: string | null
  branch: string | null
  employmentStatus: string
  employmentType: string | null
  hireDate: string | null
}

export interface EmployeeDetail extends EmployeeListRow {
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  personalEmail: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: string | null
  civilStatus: string | null
  nationality: string | null
  address: string | null
  city: string | null
  province: string | null
  barangay: string | null
  separationDate: string | null
}

const LIST_SELECT =
  'id, employee_number, first_name, middle_name, last_name, suffix, work_email, position_title, employment_status, employment_type, hire_date, departments(name), positions(title), branches(name)'

const DETAIL_SELECT =
  'id, employee_number, first_name, middle_name, last_name, suffix, work_email, personal_email, phone, date_of_birth, gender, civil_status, nationality, address, city, province, barangay, position_title, employment_status, employment_type, hire_date, separation_date, departments(name), positions(title), branches(name)'

interface JoinedRow {
  id: string
  employee_number: string
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  work_email: string | null
  position_title: string | null
  employment_status: string
  employment_type: string | null
  hire_date: string | null
  departments: { name: string } | null
  positions: { title: string } | null
  branches: { name: string } | null
  // detail-only
  personal_email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  civil_status?: string | null
  nationality?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  barangay?: string | null
  separation_date?: string | null
}

export function fullName(row: {
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
}): string {
  return [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ')
}

function toListRow(row: JoinedRow): EmployeeListRow {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    fullName: fullName(row),
    workEmail: row.work_email,
    positionTitle: row.positions?.title ?? row.position_title ?? '—',
    department: row.departments?.name ?? null,
    branch: row.branches?.name ?? null,
    employmentStatus: row.employment_status,
    employmentType: row.employment_type,
    hireDate: row.hire_date,
  }
}

export async function fetchEmployees(): Promise<EmployeeListRow[]> {
  // employment_status = 'on_leave' is date-derived, but nothing fires when an
  // approved leave's end date simply passes. Reconcile first so an employee is
  // not shown "On leave" indefinitely. The RPC is a SECURITY DEFINER recompute
  // and idempotent; a stale row is worse than the extra call.
  await supabase.rpc('sync_employment_statuses')

  const { data, error } = await supabase
    .from('employees')
    .select(LIST_SELECT)
    .order('last_name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as unknown as JoinedRow[]).map(toListRow)
}

export async function fetchEmployee(id: string): Promise<EmployeeDetail | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as unknown as JoinedRow
  return {
    ...toListRow(row),
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    suffix: row.suffix,
    personalEmail: row.personal_email ?? null,
    phone: row.phone ?? null,
    dateOfBirth: row.date_of_birth ?? null,
    gender: row.gender ?? null,
    civilStatus: row.civil_status ?? null,
    nationality: row.nationality ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    province: row.province ?? null,
    barangay: row.barangay ?? null,
    separationDate: row.separation_date ?? null,
  }
}

export const employeesQueryKey = ['people', 'employees'] as const
export const employeeQueryKey = (id: string) => ['people', 'employees', id] as const
