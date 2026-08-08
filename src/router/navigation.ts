import type { PermissionKey, RoleKey } from '@/lib/permissions'

/**
 * The JMAC sidebar: one flat list, no collapsible groups.
 *
 * Shape and labels follow the two reference apps, because that is the
 * navigation the people using this platform already know:
 *   integration/HRMS/.../components/layout/Sidebar.tsx
 *   integration/POS/src/components/AppLayout.tsx
 *
 * Visibility is decided per item, not per module. `my_modules()` answers a
 * coarser question — "may this person enter HRMS at all" — which is why an
 * HR manager and an HR staffer were seeing an identical menu.
 *
 * An item is visible when every condition it declares passes, with any-of
 * inside each: `permissions: ['a','b']` means "a or b", and adding `roles`
 * narrows further.
 */
export interface NavItem {
  label: string
  icon: string
  /** Omitted while the page is still 'planned'. */
  to?: string
  permissions?: PermissionKey[]
  /**
   * Used only where the permission catalogue cannot express the split.
   *
   * HRMS itself works this way — its `canPostJobs` and `canScreenApplicants`
   * are role predicates, not permission checks — so this mirrors the source
   * rather than inventing a rule. RLS remains the real boundary either way;
   * this only decides what is worth showing.
   */
  roles?: RoleKey[]
  status: 'ready' | 'planned'
  /** The group this item belongs to. Set on *every* item in the group, not
   *  just the first: the sidebar renders a heading when the section changes
   *  between visible items, so hiding the first item of a section no longer
   *  takes its heading with it. Purely a label — nothing collapses. */
  section?: string
}

/** Roles that oversee everything and should never be filtered out of a menu
 *  by a narrower role check. */
const ELEVATED: RoleKey[] = ['system_administrator', 'owner', 'general_manager']

/** The Administration section — users, roles, branches, audit logs, settings —
 *  is the system administrator's alone. HR and POS roles hold branch.view and
 *  department.view for their own work, which used to leak those two items into
 *  their sidebars; gating the whole section on the role, not the granular
 *  permission, keeps configuration of the platform itself with the admin. */
const ADMIN_ROLES: RoleKey[] = ['system_administrator']

export const NAVIGATION: NavItem[] = [
  { label: 'Dashboard', icon: 'LayoutDashboard', to: '/dashboard', permissions: ['dashboard.view'], status: 'ready' },

  // ---- People -------------------------------------------------------------
  // Job Posting is HR Staff's own process and Recruitment is the HR Manager's
  // — the separation of duties HRMS encodes, so the person who advertises a
  // role is not the person who screens the applicants for it.
  {
    label: 'Job Posting',
    icon: 'Briefcase',
    to: '/dashboard/job-postings',
    roles: ['hr_staff', ...ELEVATED],
    status: 'ready',
    section: 'People',
  },
  {
    label: 'Recruitment',
    icon: 'ClipboardList',
    to: '/dashboard/recruitment',
    permissions: ['applicant.screen'],
    status: 'ready',
    section: 'People',
  },
  { label: 'Interviews', icon: 'CalendarSearch', to: '/dashboard/interviews', permissions: ['interview.manage'], status: 'planned', section: 'People' },
  { label: 'Deployment', icon: 'Truck', to: '/dashboard/deployment', permissions: ['deployment.view'], status: 'planned', section: 'People' },
  { label: 'Employees', icon: 'Users', to: '/dashboard/employees', permissions: ['employee.view'], status: 'ready', section: 'People' },
  { label: 'Attendance', icon: 'CalendarClock', to: '/dashboard/attendance', permissions: ['attendance.view'], status: 'planned', section: 'People' },
  { label: 'Leave', icon: 'CalendarCheck', to: '/dashboard/leave', permissions: ['leave.view'], status: 'ready', section: 'People' },
  { label: 'Payroll', icon: 'Wallet', to: '/dashboard/payroll', permissions: ['payroll.review'], status: 'planned', section: 'People' },

  // ---- Sales --------------------------------------------------------------
  { label: 'POS', icon: 'ShoppingCart', to: '/dashboard/pos', permissions: ['sales.create'], status: 'planned', section: 'Sales' },
  // product.manage rather than inventory.view: a cashier holds inventory.view
  // so they can check stock at the till, but managing stock is not their job.
  { label: 'Inventory', icon: 'Package', to: '/dashboard/inventory', permissions: ['product.manage'], status: 'planned', section: 'Sales' },
  { label: 'Categories', icon: 'Tags', to: '/dashboard/categories', permissions: ['category.manage'], status: 'planned', section: 'Sales' },
  // Both roles hold sales.view, so the split between every transaction and
  // only your own is a role question, exactly as it is in the POS app.
  { label: 'Transactions', icon: 'Receipt', to: '/dashboard/transactions', roles: ['pos_manager', ...ELEVATED], status: 'planned', section: 'Sales' },
  { label: 'My Transactions', icon: 'Receipt', to: '/dashboard/my-transactions', roles: ['cashier'], status: 'planned', section: 'Sales' },

  // ---- Reports & administration -------------------------------------------
  { label: 'Reports', icon: 'BarChart3', to: '/dashboard/reports', permissions: ['report.view'], status: 'planned', section: 'Insights' },
  // Administration is admin-only — gated on the role, not the granular
  // view permissions (which HR/POS roles partly hold). See ADMIN_ROLES above.
  { label: 'Users', icon: 'ShieldCheck', to: '/dashboard/admin/users', roles: ADMIN_ROLES, status: 'planned', section: 'Administration' },
  { label: 'Roles', icon: 'ShieldCheck', to: '/dashboard/admin/roles', roles: ADMIN_ROLES, status: 'planned', section: 'Administration' },
  { label: 'Branches', icon: 'MapPin', to: '/dashboard/admin/branches', roles: ADMIN_ROLES, status: 'planned', section: 'Administration' },
  { label: 'Departments', icon: 'Building2', to: '/dashboard/admin/departments', roles: ADMIN_ROLES, status: 'planned', section: 'Administration' },
  { label: 'Audit Logs', icon: 'ClipboardCheck', to: '/dashboard/admin/audit', roles: ADMIN_ROLES, status: 'planned', section: 'Administration' },
  { label: 'Settings', icon: 'Cog', to: '/dashboard/settings', roles: ADMIN_ROLES, status: 'planned', section: 'Administration' },
]
