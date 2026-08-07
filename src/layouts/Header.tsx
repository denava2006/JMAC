import { Bell, LogOut, Menu, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

/** "Maria Santos" -> "MS". Falls back to the first letter of the email when a
 *  profile has no name yet, so the avatar is never blank. */
export function initialsFor(fullName: string | null | undefined, email: string | null | undefined): string {
  const source = fullName?.trim()
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
    return (first + last).toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

export interface HeaderProps {
  onOpenNav?: () => void
  className?: string
}

export function Header({ onOpenNav, className }: HeaderProps) {
  const { profile, authorization, signOut } = useAuth()
  const roleNames = authorization.roles.map((role) => role.name).join(', ')

  return (
    <header
      className={cn(
        'flex h-14 items-center gap-3 border-b border-border bg-surface px-4',
        className
      )}
    >
      {onOpenNav ? (
        <Button variant="ghost" size="icon" onClick={onOpenNav} className="lg:hidden">
          <Menu aria-hidden="true" />
          <span className="sr-only">Open navigation</span>
        </Button>
      ) : null}

      <span className="text-sm font-semibold tracking-tight text-heading">JMAC</span>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Bell aria-hidden="true" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback>{initialsFor(profile?.full_name, profile?.email)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Open account menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel>
              <span className="block font-medium text-heading">
                {profile?.full_name ?? profile?.email ?? 'Signed in'}
              </span>
              {roleNames ? (
                <span className="block text-xs font-normal text-muted-foreground">{roleNames}</span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void signOut()}>
              <LogOut aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
