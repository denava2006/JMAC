import type { ComponentProps, ReactElement } from 'react'
import { ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { cn } from '@/lib/utils'

/** Categorical series colours, in the order a chart should consume them.
 *
 *  These read CSS variables rather than hex so a brand or palette change
 *  reaches charts too — the token-discipline guard would reject the literals,
 *  and rightly: a hard-coded chart palette is exactly the kind of colour that
 *  silently stops following the design system. */
export const CHART_SERIES = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-body)',
] as const

/** Ordinal, not categorical: use for a single measure whose magnitude varies,
 *  where the reader should perceive an order. */
export const CHART_AXIS = 'var(--color-border)'
export const CHART_LABEL = 'var(--color-muted-foreground)'

export function chartSeriesColor(index: number): string {
  return CHART_SERIES[index % CHART_SERIES.length] as string
}

export interface ChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Recharts requires a single element child it can measure and clone. */
  children: ReactElement
  /** Fixed height in pixels. Recharts cannot measure a percentage height
   *  inside a flex or grid parent, which renders the chart at zero height —
   *  the most common way a Recharts chart silently disappears. */
  height?: number
  /** Announced to screen readers, which cannot read an SVG chart. Say what
   *  the chart shows and its headline, not "bar chart". */
  label: string
}

export function Chart({ className, children, height = 280, label, ...props }: ChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }} {...props}>
      <span className="sr-only">{label}</span>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

/** Recharts' default tooltip is a white box with a black border that ignores
 *  the design system entirely.
 *
 *  Typed from the component rather than Recharts' exported `TooltipProps`,
 *  whose value generic does not accept the mixed string-or-number payloads a
 *  real chart passes. */
export type ChartTooltipProps = ComponentProps<typeof RechartsTooltip>

export function ChartTooltip(props: ChartTooltipProps) {
  return (
    <RechartsTooltip
      cursor={{ fill: 'var(--color-muted)' }}
      contentStyle={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-heading)',
        fontSize: '0.75rem',
        boxShadow: 'var(--shadow-md)',
      }}
      labelStyle={{ color: 'var(--color-body)' }}
      {...props}
    />
  )
}
