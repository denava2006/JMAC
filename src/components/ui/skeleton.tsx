import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export type SkeletonProps = ComponentProps<'div'>

/** Purely decorative: a screen reader should hear the Loader's status message,
 *  not a description of grey rectangles. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}
