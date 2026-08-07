import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const spinnerVariants = cva('animate-spin text-muted-foreground', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export interface LoaderProps
  extends ComponentProps<'div'>,
    VariantProps<typeof spinnerVariants> {
  /** Announced to screen readers. Defaults to "Loading"; pass something
   *  specific ("Loading employees") when the page knows what it is waiting on. */
  label?: string
}

export function Loader({ className, size, label = 'Loading', ...props }: LoaderProps) {
  return (
    <div
      role="status"
      className={cn('inline-flex items-center gap-2', className)}
      {...props}
    >
      <Loader2 className={spinnerVariants({ size })} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
