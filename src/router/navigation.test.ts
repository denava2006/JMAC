import { describe, expect, it } from 'vitest'
import { isVisible } from '@/layouts/Sidebar'
import type { Authorization, PermissionKey, RoleKey, UserRole } from '@/lib/permissions'
import { NAVIGATION } from '@/router/navigation'

const RANK: Record<string, number> = {
  system_administrator: 100,
  hr_manager: 70,
  pos_manager: 70,
  hr_staff: 50,
  cashier: 40,
}

function auth(roles: RoleKey[], permissions: PermissionKey[]): Authorization {
  return {
    permissions: new Set(permissions),
    roles: roles.map((key): UserRole => ({ key, name: key, rank: RANK[key] ?? 10 })),
    modules: [],
  }
}

const menuFor = (a: Authorization) => NAVIGATION.filter((item) => isVisible(a, item)).map((i) => i.label)

/** Taken from public.role_permissions in jmac-suite, not invented. Only the
 *  keys the sidebar actually gates on are listed. */
const HR_STAFF = auth(
  ['hr_staff'],
  [
    'dashboard.view', 'recruitment.manage', 'interview.manage', 'deployment.view',
    'employee.view', 'attendance.view', 'leave.view', 'payroll.review',
    'report.view', 'branch.view', 'department.view',
  ]
)

const HR_MANAGER = auth(
  ['hr_manager'],
  [
    'dashboard.view', 'applicant.screen', 'recruitment.manage', 'interview.manage',
    'deployment.view', 'employee.view', 'attendance.view', 'leave.view',
    'payroll.review', 'report.view', 'branch.view', 'department.view', 'company.view',
  ]
)

const POS_MANAGER = auth(
  ['pos_manager'],
  [
    'dashboard.view', 'sales.create', 'sales.view', 'sales.refund', 'product.manage',
    'product.view', 'inventory.view', 'inventory.manage', 'category.manage',
    'report.view', 'branch.view',
  ]
)

const CASHIER = auth(
  ['cashier'],
  ['dashboard.view', 'sales.create', 'sales.view', 'product.view', 'inventory.view']
)

// system_administrator holds every permission and the admin role.
const ADMIN = auth(
  ['system_administrator'],
  [
    'dashboard.view', 'user.view', 'role.view', 'branch.view', 'department.view',
    'activity_log.view', 'company.view', 'report.view', 'employee.view', 'leave.view',
  ]
)

describe('HR menus differ by role', () => {
  // The complaint that prompted this: both HR roles saw an identical menu,
  // because visibility came from my_modules() — which only knows "may this
  // person enter HRMS", not who does what inside it.
  it('gives Job Posting to HR Staff and not to the HR Manager', () => {
    expect(menuFor(HR_STAFF)).toContain('Job Posting')
    expect(menuFor(HR_MANAGER)).not.toContain('Job Posting')
  })

  it('gives Recruitment to the HR Manager and not to HR Staff', () => {
    expect(menuFor(HR_MANAGER)).toContain('Recruitment')
    expect(menuFor(HR_STAFF)).not.toContain('Recruitment')
  })

  it('produces genuinely different menus', () => {
    expect(menuFor(HR_STAFF)).not.toEqual(menuFor(HR_MANAGER))
  })

  it('still shares the work both roles do', () => {
    for (const shared of ['Interviews', 'Employees', 'Attendance', 'Leave', 'Payroll']) {
      expect(menuFor(HR_STAFF)).toContain(shared)
      expect(menuFor(HR_MANAGER)).toContain(shared)
    }
  })

  it('keeps HR out of the till', () => {
    for (const menu of [menuFor(HR_STAFF), menuFor(HR_MANAGER)]) {
      expect(menu).not.toContain('POS')
      expect(menu).not.toContain('Transactions')
    }
  })
})

describe('POS menus differ by role', () => {
  it('gives the manager the full counter', () => {
    const menu = menuFor(POS_MANAGER)
    for (const label of ['Dashboard', 'POS', 'Inventory', 'Categories', 'Transactions', 'Reports']) {
      expect(menu).toContain(label)
    }
  })

  it('gives the cashier only the till and their own transactions', () => {
    expect(menuFor(CASHIER)).toEqual(['Dashboard', 'POS', 'My Transactions'])
  })

  // A cashier holds inventory.view so they can check stock at the till, which
  // is why Inventory gates on product.manage instead.
  it('keeps stock management away from the cashier', () => {
    expect(menuFor(CASHIER)).not.toContain('Inventory')
    expect(menuFor(CASHIER)).not.toContain('Categories')
  })

  it('separates every transaction from your own', () => {
    expect(menuFor(POS_MANAGER)).toContain('Transactions')
    expect(menuFor(POS_MANAGER)).not.toContain('My Transactions')
    expect(menuFor(CASHIER)).toContain('My Transactions')
    expect(menuFor(CASHIER)).not.toContain('Transactions')
  })

  it('keeps the cashier out of Reports', () => {
    expect(menuFor(CASHIER)).not.toContain('Reports')
    expect(menuFor(POS_MANAGER)).toContain('Reports')
  })

  it('keeps POS out of the HR pages', () => {
    for (const menu of [menuFor(POS_MANAGER), menuFor(CASHIER)]) {
      expect(menu).not.toContain('Employees')
      expect(menu).not.toContain('Payroll')
    }
  })
})

describe('the navigation itself', () => {
  it('is flat — no item declares children', () => {
    for (const item of NAVIGATION) {
      expect(item).not.toHaveProperty('items')
    }
  })

  it('shows nothing to someone with no roles and no permissions', () => {
    expect(menuFor(auth([], []))).toEqual([])
  })
})

describe('Administration is admin-only', () => {
  const ADMIN_ITEMS = ['Users', 'Roles', 'Branches', 'Departments', 'Audit Logs', 'Settings']

  it('shows every Administration item to the system administrator', () => {
    const menu = menuFor(ADMIN)
    for (const item of ADMIN_ITEMS) {
      expect(menu).toContain(item)
    }
  })

  // The change that prompted this: HR and POS roles hold branch.view and
  // department.view for their own work, which used to surface Branches and
  // Departments in their sidebars. Gating on the role, not the permission,
  // removes the whole section from everyone but the admin.
  it('hides Branches and Departments from HR, who hold those view permissions', () => {
    for (const menu of [menuFor(HR_MANAGER), menuFor(HR_STAFF)]) {
      expect(menu).not.toContain('Branches')
      expect(menu).not.toContain('Departments')
    }
  })

  it('shows no Administration item to any non-admin role', () => {
    for (const menu of [menuFor(HR_MANAGER), menuFor(HR_STAFF), menuFor(POS_MANAGER), menuFor(CASHIER)]) {
      for (const item of ADMIN_ITEMS) {
        expect(menu).not.toContain(item)
      }
    }
  })
})
