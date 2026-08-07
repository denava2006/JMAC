import {
  BarChart3,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserModule } from '@/lib/permissions'
import { cn } from '@/lib/utils'

/** The database stores an icon *name* per module. Mapping it here rather than
 *  evaluating a string keeps the icon set a closed, tree-shakeable list — an
 *  unknown name falls back rather than crashing the sidebar. */
const MODULE_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings,
}

function iconFor(name: string): LucideIcon {
  return MODULE_ICONS[name] ?? LayoutDashboard
}

export interface SidebarNavProps {
  onNavigate?: () => void
  className?: string
}

/**
 * One navigation, three widths.
 *
 * The tablet icon rail is a CSS state, not a second component. Rendering a
 * collapsed copy alongside an expanded one — even with one of them display:none
 * — puts two `nav` landmarks with the same label in the accessibility tree, and
 * a screen-reader user hears every destination twice.
 *
 * `sr-only lg:not-sr-only` is what makes that work: below `lg` the label is
 * available to assistive technology but takes no space, and from `lg` up it
 * renders normally.
 */
export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const { authorization } = useAuth()

  return (
    <nav aria-label="Main" className={cn('flex flex-col gap-1 p-3', className)}>
      {authorization.modules.map((module: UserModule) => {
        const Icon = iconFor(module.icon)
        return (
          <NavLink
            key={module.key}
            to={module.route}
            end={module.route === '/dashboard'}
            onClick={onNavigate}
            title={module.name}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
                'justify-center px-0 lg:justify-start lg:px-3',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-body hover:bg-muted hover:text-heading'
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="sr-only lg:not-sr-only">{module.name}</span>
          </NavLink>
        )
      })}

      {authorization.modules.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          No modules are assigned to your account.
        </p>
      ) : null}
    </nav>
  )
}
