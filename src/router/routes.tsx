import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader } from '@/components/ui/loader'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AnonymousOnly, ProtectedRoute } from '@/router/guards'

// Route-level code splitting: nobody signing in should download the dashboard,
// and nobody on the dashboard should download the reset-password form.
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const ComponentGallery = lazy(() => import('@/app/ComponentGallery'))

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <Loader size="lg" label="Loading" />
    </div>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Track 4 replaces this with the landing page. */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <AnonymousOnly>
              <Lazy>
                <LoginPage />
              </Lazy>
            </AnonymousOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AnonymousOnly>
              <Lazy>
                <ForgotPasswordPage />
              </Lazy>
            </AnonymousOnly>
          }
        />
        {/* Not AnonymousOnly: arriving here from a recovery link means Supabase
            has already created a session, so the guard would bounce every user
            straight back to the dashboard without letting them set a password. */}
        <Route
          path="/reset-password"
          element={
            <Lazy>
              <ResetPasswordPage />
            </Lazy>
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <Lazy>
              <DashboardPage />
            </Lazy>
          }
        />
      </Route>

      {/* Development only: the component gallery that Track 2 was verified
          against. Not linked from anywhere in the app. */}
      {import.meta.env.DEV ? (
        <Route
          path="/dev/components"
          element={
            <Lazy>
              <ComponentGallery />
            </Lazy>
          }
        />
      ) : null}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
