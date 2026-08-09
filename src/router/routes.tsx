import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader } from '@/components/ui/loader'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AnonymousOnly, ProtectedRoute, RequirePermission } from '@/router/guards'

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
const EmployeesPage = lazy(() =>
  import('@/features/people/EmployeesPage').then((m) => ({ default: m.EmployeesPage }))
)
const LeavePage = lazy(() =>
  import('@/features/people/LeavePage').then((m) => ({ default: m.LeavePage }))
)
const JobPostingsPage = lazy(() =>
  import('@/features/people/JobPostingsPage').then((m) => ({ default: m.JobPostingsPage }))
)
const RecruitmentPage = lazy(() =>
  import('@/features/people/RecruitmentPage').then((m) => ({ default: m.RecruitmentPage }))
)
const InterviewsPage = lazy(() =>
  import('@/features/people/InterviewsPage').then((m) => ({ default: m.InterviewsPage }))
)
const ComponentGallery = lazy(() => import('@/app/ComponentGallery'))
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
)
const CareersPage = lazy(() =>
  import('@/features/careers/CareersPage').then((m) => ({ default: m.CareersPage }))
)
const CareerDetailPage = lazy(() =>
  import('@/features/careers/CareersPage').then((m) => ({ default: m.CareerDetailPage }))
)
const ApplyPage = lazy(() =>
  import('@/features/careers/ApplyPage').then((m) => ({ default: m.ApplyPage }))
)
const ApplicationSuccessPage = lazy(() =>
  import('@/features/careers/ApplicationSuccessPage').then((m) => ({ default: m.ApplicationSuccessPage }))
)
const TrackApplicationPage = lazy(() =>
  import('@/features/careers/TrackApplicationPage').then((m) => ({ default: m.TrackApplicationPage }))
)

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
      {/* Public. Deliberately not behind AnonymousOnly: a signed-in user
          following a link to the careers page should read it, not be bounced
          to the dashboard. */}
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <Lazy>
              <LandingPage />
            </Lazy>
          }
        />
        <Route
          path="/careers"
          element={
            <Lazy>
              <CareersPage />
            </Lazy>
          }
        />
        {/* Static segment: React Router ranks it above the dynamic
            "/careers/:id" so the success page is never read as a posting id. */}
        <Route
          path="/careers/application-success"
          element={
            <Lazy>
              <ApplicationSuccessPage />
            </Lazy>
          }
        />
        <Route
          path="/careers/track"
          element={
            <Lazy>
              <TrackApplicationPage />
            </Lazy>
          }
        />
        <Route
          path="/careers/:id"
          element={
            <Lazy>
              <CareerDetailPage />
            </Lazy>
          }
        />
        <Route
          path="/careers/:id/apply"
          element={
            <Lazy>
              <ApplyPage />
            </Lazy>
          }
        />
      </Route>

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
        <Route
          path="/dashboard/employees"
          element={
            <RequirePermission permission="employee.view">
              <Lazy>
                <EmployeesPage />
              </Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="/dashboard/leave"
          element={
            <RequirePermission permission="leave.view">
              <Lazy>
                <LeavePage />
              </Lazy>
            </RequirePermission>
          }
        />
        {/* The sidebar shows Job Posting to HR Staff (HR Manager gets
            Recruitment instead), but the route gate is the permission RLS
            actually enforces — recruitment.manage, held by both HR roles and
            admin. Anyone who genuinely cannot post is refused; the nav split
            is the editorial choice about whose primary workflow this is. */}
        <Route
          path="/dashboard/job-postings"
          element={
            <RequirePermission permission="recruitment.manage">
              <Lazy>
                <JobPostingsPage />
              </Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="/dashboard/recruitment"
          element={
            <RequirePermission permission="applicant.screen">
              <Lazy>
                <RecruitmentPage />
              </Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="/dashboard/interviews"
          element={
            <RequirePermission permission="interview.manage">
              <Lazy>
                <InterviewsPage />
              </Lazy>
            </RequirePermission>
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
