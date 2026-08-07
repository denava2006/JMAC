import { ChevronRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  /** Omitted on the last item — the page you are already on is not a link. */
  href?: string
}

export interface BreadcrumbProps extends Omit<ComponentProps<'nav'>, 'children'> {
  items: BreadcrumbItem[]
  /** Lets Track 3 pass React Router's Link without this component importing a
   *  router it has no other use for. */
  renderLink?: (item: BreadcrumbItem) => ReactNode
}

export function Breadcrumb({ className, items, renderLink, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {isLast || !item.href ? (
                // aria-current tells a screen reader which crumb is the page,
                // which the visual weight alone does not.
                <span aria-current={isLast ? 'page' : undefined} className="font-medium text-heading">
                  {item.label}
                </span>
              ) : renderLink ? (
                renderLink(item)
              ) : (
                <a href={item.href} className="text-body transition-colors hover:text-heading">
                  {item.label}
                </a>
              )}
              {isLast ? null : (
                <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
