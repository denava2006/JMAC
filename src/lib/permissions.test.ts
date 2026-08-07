import { describe, expect, it } from 'vitest'
import {
  EMPTY_AUTHORIZATION,
  can,
  canAccessModule,
  canAll,
  canAny,
  hasRole,
  highestRank,
  type Authorization,
  type PermissionKey,
} from '@/lib/permissions'

function authorization(overrides: Partial<Authorization> = {}): Authorization {
  return {
    permissions: new Set<PermissionKey>(['employee.view', 'attendance.view']),
    roles: [
      { key: 'hr_staff', name: 'HR Staff', rank: 50 },
      { key: 'finance_staff', name: 'Finance Staff', rank: 50 },
    ],
    modules: [
      { key: 'core', name: 'Administration', route: '/dashboard', icon: 'LayoutDashboard', sortOrder: 0 },
      { key: 'hrms', name: 'HRMS', route: '/dashboard/hrms', icon: 'Users', sortOrder: 1 },
    ],
    ...overrides,
  }
}

describe('can', () => {
  it('is true for a held permission', () => {
    expect(can(authorization(), 'employee.view')).toBe(true)
  })

  it('is false for one that is not held', () => {
    expect(can(authorization(), 'payroll.approve')).toBe(false)
  })

  it('is false for everything when nobody is signed in', () => {
    expect(can(EMPTY_AUTHORIZATION, 'employee.view')).toBe(false)
  })
})

describe('canAny', () => {
  it('is true when one of several is held', () => {
    expect(canAny(authorization(), ['payroll.approve', 'employee.view'])).toBe(true)
  })

  it('is false when none is held', () => {
    expect(canAny(authorization(), ['payroll.approve', 'sales.create'])).toBe(false)
  })

  // An empty list means "no permission is required", but `some` returns false
  // for it. Asserting the behaviour so a caller passing a computed list knows
  // what it gets.
  it('is false for an empty list', () => {
    expect(canAny(authorization(), [])).toBe(false)
  })
})

describe('canAll', () => {
  it('is true only when every permission is held', () => {
    expect(canAll(authorization(), ['employee.view', 'attendance.view'])).toBe(true)
    expect(canAll(authorization(), ['employee.view', 'payroll.approve'])).toBe(false)
  })

  it('is vacuously true for an empty list, matching Array.every', () => {
    expect(canAll(authorization(), [])).toBe(true)
  })
})

describe('hasRole', () => {
  it('finds a role among several held at once', () => {
    // The seeded manager holds hr_manager, pos_manager and finance_manager;
    // a single-role assumption would be wrong for a real account.
    expect(hasRole(authorization(), 'finance_staff')).toBe(true)
    expect(hasRole(authorization(), 'hr_staff')).toBe(true)
  })

  it('is false for a role not held', () => {
    expect(hasRole(authorization(), 'system_administrator')).toBe(false)
  })
})

describe('highestRank', () => {
  it('returns the highest rank among the roles held', () => {
    const auth = authorization({
      roles: [
        { key: 'employee', name: 'Employee', rank: 10 },
        { key: 'hr_manager', name: 'HR Manager', rank: 70 },
        { key: 'cashier', name: 'Cashier', rank: 40 },
      ],
    })
    expect(highestRank(auth)).toBe(70)
  })

  it('is 0 for a user with no roles, so comparisons never see NaN', () => {
    expect(highestRank(EMPTY_AUTHORIZATION)).toBe(0)
  })
})

describe('canAccessModule', () => {
  it('is true for a module the database returned', () => {
    expect(canAccessModule(authorization(), 'hrms')).toBe(true)
  })

  it('is false for one it did not', () => {
    expect(canAccessModule(authorization(), 'pos')).toBe(false)
    expect(canAccessModule(authorization(), 'finance')).toBe(false)
  })
})
