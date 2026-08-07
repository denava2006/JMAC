import { TrendingDown, TrendingUp } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface StatCardProps extends Omit<ComponentProps<'div'>, 'title'> {
  label: string
  value: ReactNode
  icon?: ReactNode
  /** Signed percentage change against the previous period. The sign chooses
   *  the arrow and the colour; the caller does not pick either, so "down is
   *  red" cannot drift between the dashboard's twelve tiles. */
  delta?: number
  deltaLabel?: string
  /** Renders the tile's own skeleton rather than making every dashboard
   *  widget invent its loading shape. */
  loading?: boolean
}

export function StatCard({
  className,
  label,
  value,
  icon,
  delta,
  deltaLabel = 'vs last period',
  loading = false,
  ...props
}: StatCardProps) {
  const improving = delta !== undefined && delta >= 0
  const TrendIcon = improving ? TrendingUp : TrendingDown

  return (
    <Card className={cn('p-6', className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-body">{label}</p>
        {icon ? <div className="text-muted-foreground [&_svg]:size-4">{icon}</div> : null}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="tabular mt-3 text-2xl font-semibold text-heading">{value}</p>
      )}

      {delta !== undefined && !loading ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <TrendIcon
            className={cn('size-3.5', improving ? 'text-success' : 'text-error')}
            aria-hidden="true"
          />
          <span className={cn('tabular font-medium', improving ? 'text-success' : 'text-error')}>
            {improving ? '+' : ''}
            {delta}%
          </span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>
      ) : null}
    </Card>
  )
}
