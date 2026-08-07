import type { PermissionKey } from '@/types/permissions.generated'

export type { PermissionKey }

/** A role key from public.roles. Not generated: the eleven roles are a
 *  business decision that changes with a migration, not a catalogue that
 *  grows. */
export type RoleKey =
  | 'system_administrator'
  | 'owner'
  | 'general_manager'
  | 'hr_manager'
  | 'finance_manager'
  | 'pos_manager'
  | 'accountant'
  | 'hr_staff'
  | 'finance_staff'
  | 'cashier'
  | 'employee'

export interface UserRole {
  key: RoleKey
  name: string
  /** Higher outranks lower. system_administrator is 100, employee is 10. */
  rank: number
}

/** A module the signed-in user may enter, straight from `my_modules()`. The
 *  sidebar is built from this rather than a hand-written array, so a module
 *  the database will not admit them to cannot appear. */
export interface UserModule {
  key: string
  name: string
  route: string
  icon: string
  sortOrder: number
}

/**
 * Authorization state for the signed-in user.
 *
 * This is presentation, not security. Every check here has a matching policy
 * in Postgres, and the policy is what actually stops anyone — hiding a menu
 * item is never the only thing standing between a cashier and payroll.
 */
export interface Authorization {
  permissions: ReadonlySet<PermissionKey>
  roles: readonly UserRole[]
  modules: readonly UserModule[]
}

export const EMPTY_AUTHORIZATION: Authorization = {
  permissions: new Set<PermissionKey>(),
  roles: [],
  modules: [],
}

export function can(auth: Authorization, permission: PermissionKey): boolean {
  return auth.permissions.has(permission)
}

/** True if the user holds any one of these. Use for a menu entry that several
 *  different permissions could justify. */
export function canAny(auth: Authorization, permissions: readonly PermissionKey[]): boolean {
  return permissions.some((permission) => auth.permissions.has(permission))
}

/** True only if the user holds every one. Use for an action that genuinely
 *  needs several, such as moving an employee between branches. */
export function canAll(auth: Authorization, permissions: readonly PermissionKey[]): boolean {
  return permissions.every((permission) => auth.permissions.has(permission))
}

export function hasRole(auth: Authorization, role: RoleKey): boolean {
  return auth.roles.some((held) => held.key === role)
}

/** The highest rank the user holds, or 0 for a user with no roles. Useful for
 *  "can this person act on that person" questions, which the database answers
 *  with current_role_rank(). */
export function highestRank(auth: Authorization): number {
  return auth.roles.reduce((highest, role) => Math.max(highest, role.rank), 0)
}

export function canAccessModule(auth: Authorization, moduleKey: string): boolean {
  return auth.modules.some((module) => module.key === moduleKey)
}
