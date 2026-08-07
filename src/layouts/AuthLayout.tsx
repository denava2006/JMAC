import { Outlet } from 'react-router-dom'

/** The signed-out shell for login, forgot password, and reset password.
 *  Deliberately has no navigation: someone who cannot sign in has nowhere to
 *  go, and a nav here would offer links that all bounce back to /login. */
export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-tight text-heading">JMAC</p>
          <p className="mt-1 text-sm text-body">Enterprise Business Platform</p>
        </div>
        <Outlet />
        <p className="mt-8 text-center text-xs text-muted-foreground">
          JMAC Digital Enterprise
        </p>
      </div>
    </div>
  )
}
