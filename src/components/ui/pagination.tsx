import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PaginationProps extends Omit<ComponentProps<'nav'>, 'onChange'> {
  /** One-based, because that is what the label says out loud. */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** Optional row count, rendered as context beside the page indicator. */
  totalRows?: number
}

export function Pagination({
  className,
  page,
  pageCount,
  onPageChange,
  totalRows,
  ...props
}: PaginationProps) {
  const canGoBack = page > 1
  const canGoForward = page < pageCount

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4 py-3', className)}
      {...props}
    >
      <p className="text-sm text-body">
        Page <span className="tabular font-medium text-heading">{page}</span> of{' '}
        <span className="tabular font-medium text-heading">{pageCount}</span>
        {totalRows !== undefined ? (
          <span className="text-muted-foreground">
            {' '}
            · <span className="tabular">{totalRows}</span> rows
          </span>
        ) : null}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!canGoBack}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canGoForward}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
