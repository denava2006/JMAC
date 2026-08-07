import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarSearch,
  ClipboardCheck,
  ClipboardList,
  Cog,
  LayoutDashboard,
  MapPin,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { canAny, hasRole, type Authorization } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { NAVIGATION, type NavItem } from '@/router/navigation'

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  CalendarSearch,
  Truck,
  Users,
  CalendarClock,
  CalendarCheck,
  Wallet,
  ShoppingCart,
  Package,
  Tags,
  Receipt,
  BarChart3,
  ShieldCheck,
  MapPin,
  Building2,
  ClipboardCheck,
  Cog,
}

/** Every condition an item declares must pass, any-of within each. An item
 *  declaring neither is visible to anyone signed in. */
export function isVisible(auth: Authorization, item: NavItem): boolean {
  if (item.permissions && !canAny(auth, item.permissions)) return false
  if (item.roles && !item.roles.some((role) => hasRole(auth, role))) return false
  return true
}

const rowClasses = (active: boolean) =>
  cn(
    'flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
    'justify-center px-0 lg:justify-start lg:px-3',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    active ? 'bg-primary text-primary-foreground' : 'text-body hover:bg-muted hover:text-heading'
  )

export interface SidebarNavProps {
  onNavigate?: () => void
  className?: string
}

/**
 * One flat navigation, three widths.
 *
 * Flat by design: an enterprise sidebar that hides Payroll behind a
 * disclosure costs a click on every visit and hides the shape of the platform.
 * Section labels group without collapsing.
 *
 * The tablet icon rail is a CSS state, not a second component — rendering a
 * collapsed copy beside an expanded one puts two `nav` landmarks in the
 * accessibility tree and a screen-reader user hears every destination twice.
 * `sr-only lg:not-sr-only` gives the label to assistive technology at every
 * width while showing it only from `lg` up.
 */
export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const { authorization } = useAuth()
  const items = NAVIGATION.filter((item) => isVisible(authorization, item))

  // The heading is emitted when the section changes between *visible* items,
  // so it attaches to whichever item survives filtering. Pinning it to one
  // named item lost the "People" heading for an HR manager, who cannot see
  // Job Posting — and a role that sees no Sales page gets no Sales heading.
  let lastSection: string | undefined

  return (
    <nav aria-label="Main" className={cn('p-3', className)}>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard
          const section = item.section && item.section !== lastSection ? item.section : undefined
          if (item.section) lastSection = item.section

          return (
            <li key={item.label}>
              {section ? (
                <p className="mt-4 mb-1 hidden px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
                  {section}
                </p>
              ) : null}

              {item.status === 'planned' || !item.to ? (
                <span
                  aria-disabled="true"
                  title={`${item.label} — coming in a later phase`}
                  className={cn(rowClasses(false), 'cursor-not-allowed opacity-45 hover:bg-transparent')}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="sr-only lg:not-sr-only">{item.label}</span>
                  <span className="sr-only"> (coming soon)</span>
                </span>
              ) : (
                <NavLink
                  to={item.to}
                  end={item.to === '/dashboard'}
                  onClick={onNavigate}
                  title={item.label}
                  className={({ isActive }) => rowClasses(isActive)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="sr-only lg:not-sr-only">{item.label}</span>
                </NavLink>
              )}
            </li>
          )
        })}
      </ul>

      {items.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          No modules are assigned to your account.
        </p>
      ) : null}
    </nav>
  )
}
