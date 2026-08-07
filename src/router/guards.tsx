import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ErrorState } from '@/components/ui/error-state'
import { Loader } from '@/components/ui/loader'
import { useAuth } from '@/contexts/AuthContext'
import { can, type PermissionKey } from '@/lib/permissions'

/** Shown while the session is being restored. Without it, a page refresh
 *  briefly has no session and every guard would bounce the user to /login. */
function Restoring() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <Loader size="lg" label="Restoring your session" />
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <Restoring />

  if (!session) {
    // `state.from` lets the login page send them back where they were headed,
    // so a bookmarked deep link survives the detour through sign-in.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <>{children}</>
}

export function AnonymousOnly({ children }: { children: ReactNode }) {
  const { session, initializing } = useAuth()

  if (initializing) return <Restoring />
  if (session) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

export interface RequirePermissionProps {
  permission: PermissionKey
  children: ReactNode
}

/**
 * Renders a 403 rather than redirecting.
 *
 * A redirect on insufficient permission makes a bookmarked URL silently bounce
 * to the dashboard, which reads as a broken link. Saying "you do not have
 * access to this" explains itself, and it is what lets someone ask an
 * administrator for the right permission by name.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { authorization, initializing } = useAuth()

  if (initializing) return <Restoring />

  if (!can(authorization, permission)) {
    return (
      <ErrorState
        title="You don’t have access to this page"
        description="Ask an administrator if you need it. Your other modules are still available from the menu."
      />
    )
  }

  return <>{children}</>
}
