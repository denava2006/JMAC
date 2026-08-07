import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Purely decorative: a screen reader should hear the Loader's status message,
 *  not a description of grey rectangles. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}
