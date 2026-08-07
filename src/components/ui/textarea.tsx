import type { ComponentProps } from 'react'
import { focusRing } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        'flex min-h-20 w-full rounded-md border bg-surface px-3 py-2 text-sm text-heading',
        'transition-colors duration-150 placeholder:text-muted-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-error' : 'border-input',
        focusRing,
        className
      )}
      {...props}
    />
  )
}
