import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { useAuth } from '@/contexts/AuthContext'
import { can, type PermissionKey } from '@/lib/permissions'

export interface MetricTileProps<T> {
  label: string
  icon?: ReactNode
  /** The tile renders only if the signed-in user holds this. The query is
   *  gated on it too, so an unauthorised request is never sent — RLS would
   *  refuse it, but a refused request is still a request. */
  permission: PermissionKey
  queryKey: readonly unknown[]
  queryFn: () => Promise<T>
  format: (value: T) => string
}

export function MetricTile<T>({
  label,
  icon,
  permission,
  queryKey,
  queryFn,
  format,
}: MetricTileProps<T>) {
  const { authorization } = useAuth()
  const allowed = can(authorization, permission)

  const { data, isPending, isError } = useQuery({
    queryKey,
    queryFn,
    enabled: allowed,
    staleTime: 30_000,
  })

  if (!allowed) return null

  return (
    <StatCard
      label={label}
      icon={icon}
      loading={isPending}
      // A dash, not a zero. "0 employees" and "we could not load the employee
      // count" are different facts, and a dashboard that confuses them is
      // worse than one that admits the gap.
      value={isError ? '—' : data !== undefined ? format(data) : '—'}
    />
  )
}
