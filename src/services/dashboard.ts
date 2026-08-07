import { supabase } from '@/lib/supabase'

/**
 * Dashboard metrics.
 *
 * Each metric is its own query, gated by its own permission, rather than one
 * batch call. A cashier must never send a query for payroll figures — RLS
 * would refuse it, but a refused request is still a request, and one failure
 * in a batch would take the whole dashboard down with it.
 *
 * Counts use `head: true` with an exact count: PostgREST returns the number in
 * a Content-Range header and no rows, so a headcount tile does not download
 * every employee to find out there are six.
 */

/** Local date in YYYY-MM-DD. Deliberately not toISOString(), which converts to
 *  UTC and reports "yesterday" for anyone east of Greenwich after 16:00 —
 *  which is every JMAC user, since the Philippines is UTC+8. */
export function todayIso(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Each query is written out rather than routed through a shared helper: a
 *  generic over four tables collapses the column types to their intersection,
 *  and `.eq('employment_status', …)` stops type-checking. */
export async function fetchActiveEmployees(): Promise<number> {
  const { count, error } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('employment_status', 'active')
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function fetchOpenPositionCount(): Promise<number> {
  const { count, error } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function fetchApplicantCount(): Promise<number> {
  const { count, error } = await supabase
    .from('applicants')
    .select('*', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function fetchPresentToday(): Promise<number> {
  const { count, error } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true })
    .eq('attendance_date', todayIso())
    .in('status', ['present', 'late'])
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function fetchPendingLeave(): Promise<number> {
  const { count, error } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function fetchProductCount(): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)
    .eq('is_deleted', false)
  if (error) throw new Error(error.message)
  return count ?? 0
}

/** Ten or fewer in stock. A threshold in one place beats each caller picking
 *  its own idea of "low". */
export const LOW_STOCK_THRESHOLD = 10

export async function fetchLowStockCount(): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)
    .eq('is_deleted', false)
    .lte('stock', LOW_STOCK_THRESHOLD)
  if (error) throw new Error(error.message)
  return count ?? 0
}

export interface SalesToday {
  orders: number
  revenue: number
}

export async function fetchSalesToday(): Promise<SalesToday> {
  const start = `${todayIso()}T00:00:00`
  const { data, error } = await supabase
    .from('sales')
    .select('net_sales, gross_sales, total_amount')
    .gte('created_at', start)
  if (error) throw new Error(error.message)

  const rows = data ?? []
  return {
    orders: rows.length,
    // net_sales is the figure the business runs on, but older rows predate the
    // column split and only carry total_amount. Falling back keeps a demo
    // database from showing zero revenue against a non-zero order count.
    revenue: rows.reduce(
      (sum, row) => sum + Number(row.net_sales ?? row.gross_sales ?? row.total_amount ?? 0),
      0
    ),
  }
}

export const dashboardQueryKeys = {
  employees: ['dashboard', 'employees'] as const,
  presentToday: ['dashboard', 'present-today'] as const,
  pendingLeave: ['dashboard', 'pending-leave'] as const,
  openPositions: ['dashboard', 'open-positions'] as const,
  applicants: ['dashboard', 'applicants'] as const,
  products: ['dashboard', 'products'] as const,
  lowStock: ['dashboard', 'low-stock'] as const,
  salesToday: ['dashboard', 'sales-today'] as const,
}
