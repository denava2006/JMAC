import type { ComponentProps } from 'react'
import { focusRing } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface InputProps extends ComponentProps<'input'> {
  /** Sets aria-invalid as well as the error border. A red border alone tells
   *  a screen-reader user nothing. */
  invalid?: boolean
}

export function Input({ className, invalid, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-9 w-full rounded-md border bg-surface px-3 py-1 text-sm text-heading',
        'transition-colors duration-150 placeholder:text-muted-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        invalid ? 'border-error' : 'border-input',
        focusRing,
        className
      )}
      {...props}
    />
  )
}
