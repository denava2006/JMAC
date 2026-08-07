import type { Session } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { EMPTY_AUTHORIZATION, type Authorization, type PermissionKey } from '@/lib/permissions'
import { AnonymousOnly, ProtectedRoute, RequirePermission } from '@/router/guards'

// vi.hoisted runs before the imports above are initialised, so the default
// authorization is built inline here rather than referencing
// EMPTY_AUTHORIZATION — doing that throws "Cannot access before
// initialization" at collection time.
const mockAuth = vi.hoisted(() => ({
  value: {
    session: null as Session | null,
    profile: null,
    authorization: { permissions: new Set(), roles: [], modules: [] } as unknown as Authorization,
    initializing: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth.value,
}))

function setAuth(overrides: Partial<typeof mockAuth.value>) {
  mockAuth.value = { ...mockAuth.value, ...overrides }
}

const aSession = { user: { id: 'u1' } } as unknown as Session

function withPermissions(...keys: PermissionKey[]): Authorization {
  return { ...EMPTY_AUTHORIZATION, permissions: new Set(keys) }
}

function renderAt(initial: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/login" element={<p>Sign in to JMAC</p>} />
        <Route path="/dashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('sends an anonymous visitor to the login page', () => {
    setAuth({ session: null, initializing: false })
    renderAt('/protected', <ProtectedRoute>secret</ProtectedRoute>)
    expect(screen.getByText('Sign in to JMAC')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  it('renders the page for a signed-in user', () => {
    setAuth({ session: aSession, initializing: false })
    renderAt('/protected', <ProtectedRoute>secret</ProtectedRoute>)
    expect(screen.getByText('secret')).toBeInTheDocument()
  })

  // Without this, a page refresh has no session for one render and every
  // signed-in user is bounced to /login on reload.
  it('waits rather than redirecting while the session is being restored', () => {
    setAuth({ session: null, initializing: true })
    renderAt('/protected', <ProtectedRoute>secret</ProtectedRoute>)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Sign in to JMAC')).not.toBeInTheDocument()
  })
})

describe('AnonymousOnly', () => {
  it('lets an anonymous visitor through', () => {
    setAuth({ session: null, initializing: false })
    renderAt('/protected', <AnonymousOnly>login form</AnonymousOnly>)
    expect(screen.getByText('login form')).toBeInTheDocument()
  })

  it('sends a signed-in user to the dashboard', () => {
    setAuth({ session: aSession, initializing: false })
    renderAt('/protected', <AnonymousOnly>login form</AnonymousOnly>)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})

describe('RequirePermission', () => {
  it('renders the page when the permission is held', () => {
    setAuth({
      session: aSession,
      initializing: false,
      authorization: withPermissions('employee.view'),
    })
    renderAt(
      '/protected',
      <RequirePermission permission="employee.view">employee list</RequirePermission>
    )
    expect(screen.getByText('employee list')).toBeInTheDocument()
  })

  // Explaining beats redirecting: a bookmarked URL that silently bounces to
  // the dashboard reads as a broken link.
  it('explains the refusal instead of redirecting', () => {
    setAuth({
      session: aSession,
      initializing: false,
      authorization: withPermissions('sales.create'),
    })
    renderAt(
      '/protected',
      <RequirePermission permission="employee.view">employee list</RequirePermission>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/don’t have access/)).toBeInTheDocument()
    expect(screen.queryByText('employee list')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('does not refuse before authorization has loaded', () => {
    setAuth({ session: aSession, initializing: true, authorization: EMPTY_AUTHORIZATION })
    renderAt(
      '/protected',
      <RequirePermission permission="employee.view">employee list</RequirePermission>
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
