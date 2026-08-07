import * as LabelPrimitive from '@radix-ui/react-label'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends ComponentProps<typeof LabelPrimitive.Root> {
  /** Renders a visual asterisk plus a screen-reader-only "(required)". The
   *  asterisk alone is invisible to assistive technology, so both are needed. */
  required?: boolean
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-sm font-medium text-heading',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required ? (
        <>
          <span aria-hidden="true" className="ml-0.5 text-error">*</span>
          <span className="sr-only"> (required)</span>
        </>
      ) : null}
    </LabelPrimitive.Root>
  )
}
