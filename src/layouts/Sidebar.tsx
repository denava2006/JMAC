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

export interface SidebarProps {
  /** Collapsed to an icon rail. The tablet breakpoint sets this; the mobile
   *  drawer never does, because a rail inside a drawer is just a small menu. */
  collapsed?: boolean
  onNavigate?: () => void
  className?: string
}

export function SidebarNav({ collapsed = false, onNavigate, className }: SidebarProps) {
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
            title={collapsed ? module.name : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-body hover:bg-muted hover:text-heading'
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {collapsed ? <span className="sr-only">{module.name}</span> : <span>{module.name}</span>}
          </NavLink>
        )
      })}

      {authorization.modules.length === 0 ? (
        <p className={cn('px-3 py-2 text-sm text-muted-foreground', collapsed && 'sr-only')}>
          No modules are assigned to your account.
        </p>
      ) : null}
    </nav>
  )
}
