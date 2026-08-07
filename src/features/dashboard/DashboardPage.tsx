import {
  Boxes,
  CalendarCheck,
  CalendarClock,
  Package,
  Receipt,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/AuthContext'
import { MetricTile } from '@/features/dashboard/MetricTile'
import { canAny } from '@/lib/permissions'
import {
  dashboardQueryKeys,
  fetchActiveEmployees,
  fetchApplicantCount,
  fetchLowStockCount,
  fetchOpenPositionCount,
  fetchPendingLeave,
  fetchPresentToday,
  fetchProductCount,
  fetchSalesToday,
} from '@/services/dashboard'

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

const count = (value: number) => value.toLocaleString('en-PH')

/**
 * One dashboard for the whole platform.
 *
 * There are no module dashboards — each tile decides for itself whether the
 * signed-in user may see it, so an HR manager and a cashier land on the same
 * route and get different pages. Adding a module later means adding tiles,
 * not another dashboard.
 */
export function DashboardPage() {
  const { profile, authorization } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const seesAnything = canAny(authorization, [
    'employee.view',
    'attendance.view',
    'leave.view',
    'applicant.view',
    'recruitment.view',
    'product.view',
    'inventory.view',
    'sales.view',
  ])

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />

      <div>
        <h1 className="text-2xl font-semibold text-heading">Welcome back, {firstName}</h1>
        <p className="mt-1 text-body">
          {authorization.roles.length > 0
            ? `Signed in as ${authorization.roles.map((role) => role.name).join(', ')}.`
            : 'No roles are assigned to your account yet.'}
        </p>
      </div>

      {seesAnything ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Active employees"
            icon={<Users />}
            permission="employee.view"
            queryKey={dashboardQueryKeys.employees}
            queryFn={fetchActiveEmployees}
            format={count}
          />
          <MetricTile
            label="Present today"
            icon={<CalendarCheck />}
            permission="attendance.view"
            queryKey={dashboardQueryKeys.presentToday}
            queryFn={fetchPresentToday}
            format={count}
          />
          <MetricTile
            label="Leave awaiting review"
            icon={<CalendarClock />}
            permission="leave.view"
            queryKey={dashboardQueryKeys.pendingLeave}
            queryFn={fetchPendingLeave}
            format={count}
          />
          <MetricTile
            label="Open positions"
            icon={<UserPlus />}
            permission="recruitment.view"
            queryKey={dashboardQueryKeys.openPositions}
            queryFn={fetchOpenPositionCount}
            format={count}
          />
          <MetricTile
            label="Applicants"
            icon={<UserPlus />}
            permission="applicant.view"
            queryKey={dashboardQueryKeys.applicants}
            queryFn={fetchApplicantCount}
            format={count}
          />
          <MetricTile
            label="Sales today"
            icon={<Receipt />}
            permission="sales.view"
            queryKey={dashboardQueryKeys.salesToday}
            queryFn={fetchSalesToday}
            format={(value) => count(value.orders)}
          />
          <MetricTile
            label="Revenue today"
            icon={<Wallet />}
            permission="sales.view"
            queryKey={[...dashboardQueryKeys.salesToday, 'revenue']}
            queryFn={fetchSalesToday}
            format={(value) => peso.format(value.revenue)}
          />
          <MetricTile
            label="Products"
            icon={<Package />}
            permission="product.view"
            queryKey={dashboardQueryKeys.products}
            queryFn={fetchProductCount}
            format={count}
          />
          <MetricTile
            label="Low stock"
            icon={<Boxes />}
            permission="inventory.view"
            queryKey={dashboardQueryKeys.lowStock}
            queryFn={fetchLowStockCount}
            format={count}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="Nothing is assigned to you yet"
              description="Once an administrator grants you a module, its figures appear here."
              className="border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
