import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { EMPTY_AUTHORIZATION, type Authorization } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import type { Views } from '@/lib/supabase'
import { authorizationQueryKey, fetchAuthorization } from '@/services/authorization'

/** `profiles` is a view over `users`, shaped for HRMS compatibility. It is
 *  what carries `status`, which decides whether a valid credential may sign
 *  in at all. */
type Profile = Views<'profiles'>

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  authorization: Authorization
  /** True while the initial session is being restored, or while the
   *  authorization for a restored session is still loading. Guards must wait
   *  for this: redirecting on a not-yet-loaded session logs everyone out on
   *  refresh. */
  initializing: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    console.error('Failed to load profile for signed-in user:', error.message)
    return null
  }
  return data
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = React.useState<Session | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [restoringSession, setRestoringSession] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session) setProfile(await fetchProfile(data.session.user.id))
      if (mounted) setRestoringSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setProfile(nextSession ? await fetchProfile(nextSession.user.id) : null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const {
    data: authorization,
    isPending: authorizationPending,
  } = useQuery({
    queryKey: authorizationQueryKey,
    queryFn: fetchAuthorization,
    enabled: Boolean(session),
    // Roles change rarely and a stale menu is worse than a extra request on
    // navigation, so this refetches on window focus with a short stale time.
    staleTime: 60_000,
  })

  const signIn = React.useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Reporting every failure as "wrong password" sends people hunting for a
      // typo when the real problem is that the backend is unreachable. Those
      // need very different fixes, so they say so.
      const status = (error as { status?: number }).status
      const unreachable =
        status === undefined || status === 0 || status >= 500 || /fetch|network/i.test(error.message)

      return {
        error: unreachable
          ? 'Can’t reach the server. Check that the JMAC database is running and that VITE_SUPABASE_URL is correct.'
          : 'That email and password combination doesn’t match our records.',
      }
    }

    const activeProfile = await fetchProfile(data.user.id)

    // A deactivated account must not get in on a valid credential. The
    // database enforces this too; this stops a confusing half-signed-in state
    // where the session exists but every query returns nothing.
    if (!activeProfile || activeProfile.status !== 'active') {
      await supabase.auth.signOut()
      return { error: 'This account is not active. Contact your administrator.' }
    }

    setProfile(activeProfile)
    await queryClient.invalidateQueries({ queryKey: authorizationQueryKey })
    return { error: null }
  }, [queryClient])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    // Removed, not invalidated: an invalidated query refetches, and the next
    // person to sign in on this machine must not see the last person's menu.
    queryClient.removeQueries({ queryKey: authorizationQueryKey })
  }, [queryClient])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      authorization: authorization ?? EMPTY_AUTHORIZATION,
      initializing: restoringSession || (Boolean(session) && authorizationPending),
      signIn,
      signOut,
    }),
    [session, profile, authorization, restoringSession, authorizationPending, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
