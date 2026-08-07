import { supabase } from '@/lib/supabase'
import {
  EMPTY_AUTHORIZATION,
  type Authorization,
  type PermissionKey,
  type RoleKey,
  type UserModule,
  type UserRole,
} from '@/lib/permissions'

/**
 * Reads the signed-in user's authorization from the database.
 *
 * All three answers come from the helpers RLS itself uses — `my_permissions()`,
 * `my_roles()`, `my_modules()` — so the UI and the policies cannot disagree
 * about what someone may do. A hand-written map in TypeScript would be a
 * second source of truth, and it would drift on the first migration.
 *
 * The three run concurrently: they are independent, and a sign-in that waits
 * three round trips in series is a sign-in that feels broken.
 */
export async function fetchAuthorization(): Promise<Authorization> {
  const [permissions, roles, modules] = await Promise.all([
    supabase.rpc('my_permissions'),
    supabase.rpc('my_roles'),
    supabase.rpc('my_modules'),
  ])

  const firstError = permissions.error ?? roles.error ?? modules.error
  if (firstError) {
    throw new Error(`Could not load your permissions: ${firstError.message}`)
  }

  return {
    permissions: new Set((permissions.data ?? []).map((row) => row.permission_key as PermissionKey)),
    roles: (roles.data ?? []).map(
      (row): UserRole => ({
        key: row.role_key as RoleKey,
        name: row.role_name,
        rank: row.rank,
      })
    ),
    modules: (modules.data ?? [])
      .map(
        (row): UserModule => ({
          key: row.key,
          name: row.name,
          route: row.route,
          icon: row.icon,
          sortOrder: row.sort_order,
        })
      )
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

/** TanStack Query key. Exported so a sign-out can invalidate it and a role
 *  change elsewhere can force a refetch. */
export const authorizationQueryKey = ['authorization'] as const

export { EMPTY_AUTHORIZATION }
