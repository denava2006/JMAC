import { Toaster as SonnerToaster, toast } from 'sonner'
import type { ComponentProps } from 'react'

export type ToasterProps = ComponentProps<typeof SonnerToaster>

/** Mount once, near the app root. Sonner renders into its own portal and
 *  manages the stack, so feature code only ever calls `toast(...)`.
 *
 *  Styling goes through `toastOptions.classNames` rather than sonner's CSS
 *  variables because those variables expect raw colour values, and spec 5.1
 *  requires every colour to come from a semantic token. */
export function Toaster({ position = 'bottom-right', ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      toastOptions={{
        classNames: {
          toast:
            'group flex items-center gap-3 rounded-md border border-border bg-surface p-4 text-sm shadow-md',
          title: 'font-medium text-heading',
          description: 'text-body',
          actionButton: 'rounded-sm bg-primary px-2 py-1 text-xs text-primary-foreground',
          cancelButton: 'rounded-sm bg-muted px-2 py-1 text-xs text-heading',
          success: 'border-success',
          warning: 'border-warning',
          error: 'border-error',
        },
      }}
      {...props}
    />
  )
}

export { toast }
