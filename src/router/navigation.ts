import type { PermissionKey } from '@/lib/permissions'

/**
 * The JMAC navigation, as PROJECT_CONTEXT.md specifies it.
 *
 * Why this is written here rather than read from `my_modules()`: the database
 * answers "which business areas may this person enter" — core, hrms, pos,
 * finance. That is not an information architecture. The brief asks for
 * Dashboard / People / Sales / Reports / Administration / Settings, with named
 * sub-pages beneath, and those groupings are a product decision.
 *
 * What is *not* decided here is access. Every entry declares the permission
 * key the database already governs, and the sidebar filters on it. So the
 * labels and the shape are ours; who sees them is still Postgres's answer.
 *
 * `status` exists because most of these pages arrive in Phases 3 and 4. An
 * entry marked 'planned' renders disabled rather than linking to a 404 —
 * showing the shape of the platform without pretending it is finished.
 */
export interface NavItem {
  label: string
  /** Omitted for planned items, which are not links yet. */
  to?: string
  /** Any one of these grants visibility. Empty means everyone signed in. */
  permissions: PermissionKey[]
  status: 'ready' | 'planned'
}

export interface NavGroup {
  label: string
  icon: string
  /** A group with a route is itself a destination (Dashboard); one without is
   *  only a heading for its children. */
  to?: string
  permissions: PermissionKey[]
  status: 'ready' | 'planned'
  items: NavItem[]
}

export const NAVIGATION: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    to: '/dashboard',
    permissions: ['dashboard.view'],
    status: 'ready',
    items: [],
  },
  {
    label: 'People',
    icon: 'Users',
    permissions: [
      'recruitment.view',
      'applicant.view',
      'employee.view',
      'attendance.view',
      'leave.view',
      'payroll.review',
    ],
    status: 'planned',
    items: [
      { label: 'Recruitment', to: '/dashboard/people/recruitment', permissions: ['recruitment.view'], status: 'planned' },
      { label: 'Applicants', to: '/dashboard/people/applicants', permissions: ['applicant.view'], status: 'planned' },
      { label: 'Employees', to: '/dashboard/people/employees', permissions: ['employee.view'], status: 'planned' },
      { label: 'Attendance', to: '/dashboard/people/attendance', permissions: ['attendance.view'], status: 'planned' },
      { label: 'Leave', to: '/dashboard/people/leave', permissions: ['leave.view'], status: 'planned' },
      { label: 'Payroll', to: '/dashboard/people/payroll', permissions: ['payroll.review'], status: 'planned' },
    ],
  },
  {
    label: 'Sales',
    icon: 'ShoppingCart',
    permissions: ['product.view', 'inventory.view', 'sales.view'],
    status: 'planned',
    items: [
      { label: 'Products', to: '/dashboard/sales/products', permissions: ['product.view'], status: 'planned' },
      { label: 'Inventory', to: '/dashboard/sales/inventory', permissions: ['inventory.view'], status: 'planned' },
      { label: 'Orders', to: '/dashboard/sales/orders', permissions: ['sales.view'], status: 'planned' },
      { label: 'Sales', to: '/dashboard/sales/transactions', permissions: ['sales.view'], status: 'planned' },
    ],
  },
  {
    label: 'Reports',
    icon: 'BarChart3',
    to: '/dashboard/reports',
    permissions: ['report.view'],
    status: 'planned',
    items: [],
  },
  {
    label: 'Administration',
    icon: 'Settings',
    permissions: ['user.view', 'role.view', 'branch.view', 'department.view', 'activity_log.view'],
    status: 'planned',
    items: [
      { label: 'Users', to: '/dashboard/admin/users', permissions: ['user.view'], status: 'planned' },
      { label: 'Roles', to: '/dashboard/admin/roles', permissions: ['role.view'], status: 'planned' },
      { label: 'Branches', to: '/dashboard/admin/branches', permissions: ['branch.view'], status: 'planned' },
      { label: 'Departments', to: '/dashboard/admin/departments', permissions: ['department.view'], status: 'planned' },
      { label: 'Audit logs', to: '/dashboard/admin/audit', permissions: ['activity_log.view'], status: 'planned' },
    ],
  },
  {
    label: 'Settings',
    icon: 'Cog',
    to: '/dashboard/settings',
    permissions: ['company.view'],
    status: 'planned',
    items: [],
  },
]
