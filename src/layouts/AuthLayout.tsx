import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

/** The signed-out shell for login, forgot password, and reset password.
 *  Deliberately has no navigation: someone who cannot sign in has nowhere to
 *  go — except back to the public site, which the "Back to home" link offers
 *  so a visitor who opened Login by mistake is not stranded. */
export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-body transition-colors hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-tight text-heading">JMAC</p>
          <p className="mt-1 text-sm text-body">Enterprise Business Platform</p>
        </div>
        <Outlet />
        <p className="mt-8 text-center text-xs text-muted-foreground">JMAC Digital Enterprise</p>
      </div>
    </div>
  )
}
