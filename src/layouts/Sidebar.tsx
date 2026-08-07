import {
  BarChart3,
  ChevronDown,
  Cog,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { canAny, type Authorization } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { NAVIGATION, type NavGroup, type NavItem } from '@/router/navigation'

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Cog,
}

/** Empty permissions means "anyone signed in" — `canAny` returns false for an
 *  empty list, which would hide the entry instead. */
function visible(auth: Authorization, permissions: NavItem['permissions']): boolean {
  return permissions.length === 0 || canAny(auth, permissions)
}

const linkClasses = (isActive: boolean, depth: 0 | 1) =>
  cn(
    'flex items-center gap-3 rounded-md py-2 text-sm transition-colors',
    depth === 0 ? 'font-medium' : 'font-normal',
    'justify-center px-0 lg:justify-start lg:px-3',
    depth === 1 && 'lg:pl-10',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    isActive ? 'bg-primary text-primary-foreground' : 'text-body hover:bg-muted hover:text-heading'
  )

/** A page that does not exist yet. Rendered rather than hidden so the shape of
 *  the platform is visible, but not as a link — a menu item that 404s is worse
 *  than one that says "not yet". */
function PlannedEntry({ label, depth }: { label: string; depth: 0 | 1 }) {
  return (
    <span
      aria-disabled="true"
      title={`${label} — coming in a later phase`}
      className={cn(
        'flex cursor-not-allowed items-center gap-3 rounded-md py-2 text-sm opacity-50',
        depth === 0 ? 'font-medium' : 'font-normal',
        'justify-center px-0 lg:justify-start lg:px-3',
        depth === 1 && 'lg:pl-10',
        'text-body'
      )}
    >
      <span className="sr-only lg:not-sr-only">{label}</span>
      <span className="sr-only"> (coming soon)</span>
    </span>
  )
}

function Group({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const { authorization } = useAuth()
  const location = useLocation()

  const items = group.items.filter((item) => visible(authorization, item.permissions))
  const hasChildren = items.length > 0
  const containsActive = Boolean(
    group.to ? location.pathname.startsWith(group.to) : items.some((i) => i.to && location.pathname.startsWith(i.to))
  )
  const [open, setOpen] = useState(containsActive)

  const Icon = ICONS[group.icon] ?? LayoutDashboard

  // A leaf group: Dashboard, Reports, Settings.
  if (!hasChildren) {
    if (group.status === 'planned' || !group.to) {
      return (
        <li>
          <span className="flex items-center gap-3 px-0 lg:px-3">
            <Icon className="size-4 shrink-0 opacity-50" aria-hidden="true" />
            <PlannedEntry label={group.label} depth={0} />
          </span>
        </li>
      )
    }
    return (
      <li>
        <NavLink to={group.to} end onClick={onNavigate} className={({ isActive }) => linkClasses(isActive, 0)}>
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only lg:not-sr-only">{group.label}</span>
        </NavLink>
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title={group.label}
        className={cn(
          'flex w-full items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
          'justify-center px-0 lg:justify-start lg:px-3',
          'text-body hover:bg-muted hover:text-heading',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="sr-only lg:not-sr-only">{group.label}</span>
        <ChevronDown
          className={cn('ml-auto hidden size-4 transition-transform lg:block', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.label}>
              {item.status === 'planned' || !item.to ? (
                <PlannedEntry label={item.label} depth={1} />
              ) : (
                <NavLink to={item.to} onClick={onNavigate} className={({ isActive }) => linkClasses(isActive, 1)}>
                  <span className="sr-only lg:not-sr-only">{item.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export interface SidebarNavProps {
  onNavigate?: () => void
  className?: string
}

/**
 * One navigation, three widths.
 *
 * The tablet icon rail is a CSS state, not a second component. Rendering a
 * collapsed copy alongside an expanded one — even with one hidden — puts two
 * `nav` landmarks with the same label in the accessibility tree, and a
 * screen-reader user hears every destination twice.
 *
 * `sr-only lg:not-sr-only` is what makes that work: below `lg` the label is
 * available to assistive technology but takes no space; from `lg` up it
 * renders normally.
 */
export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const { authorization } = useAuth()
  const groups = NAVIGATION.filter((group) => visible(authorization, group.permissions))

  // onNavigate goes to the links, never onto the nav element: a click handler
  // there also fires when a group is expanded, which would close the mobile
  // drawer instead of revealing the submenu.
  return (
    <nav aria-label="Main" className={cn('p-3', className)}>
      <ul className="flex flex-col gap-1">
        {groups.map((group) => (
          <Group key={group.label} group={group} onNavigate={onNavigate} />
        ))}
      </ul>

      {groups.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          No modules are assigned to your account.
        </p>
      ) : null}
    </nav>
  )
}
