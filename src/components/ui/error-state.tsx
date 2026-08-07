import { AlertCircle } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ErrorStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  className,
  title,
  description,
  onRetry,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-error',
        'bg-surface px-6 py-12 text-center',
        className
      )}
      {...props}
    >
      <AlertCircle className="size-8 text-error" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-heading">{title}</p>
        {description ? <p className="text-sm text-body">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
