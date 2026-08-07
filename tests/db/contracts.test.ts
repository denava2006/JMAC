import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

const URL = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:56321'
const ANON = process.env.VITE_SUPABASE_ANON_KEY

beforeAll(() => {
  if (!ANON) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is unset. Copy .env.example to .env, then re-run `npm run test:db`.'
    )
  }
})

const anon = () => createClient(URL, ANON as string)

describe('public careers contract', () => {
  // job_postings is empty in this environment (db-baseline.txt records
  // job_postings=0), and Postgres RLS denies silently: a missing or
  // misconfigured policy still returns `{ data: [], error: null }` rather
  // than an error. With no rows reaching a row-level check, this block can
  // only prove that anon holds the base SELECT grant, that the queried
  // schema (columns, embedded relations) is exposed as expected, and that
  // the departments/positions foreign keys resolve. It does NOT prove the
  // anon_view_open_postings policy itself is doing anything — that needs
  // real open and non-open rows to tell a leak from a lockdown.
  it('lets an anonymous visitor query job_postings', async () => {
    const { error } = await anon().from('job_postings').select('id, status')
    expect(error).toBeNull()
  })

  it('exposes only open postings to an anonymous visitor', async () => {
    const { data, error } = await anon().from('job_postings').select('status')
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    // job_postings has 0 rows today, so .every() over an empty array is
    // vacuously true — this cannot yet catch an RLS regression (e.g.
    // anon_view_open_postings dropped, or replaced with `using (true)`,
    // exposing draft/closed postings publicly). The error/Array.isArray
    // checks above are what this test can actually fail on right now; the
    // .every() below only gains real power once open listings exist.
    expect((data ?? []).every((row) => row.status === 'open')).toBe(true)
  })

  it('joins department and position names anonymously', async () => {
    const { error } = await anon()
      .from('job_postings')
      .select('id, departments(name), positions(title)')
      .order('date_posted', { ascending: false, nullsFirst: false })
    expect(error).toBeNull()
  })

  it('reads departments and positions anonymously', async () => {
    const [departments, positions] = await Promise.all([
      anon().from('departments').select('id, name').limit(1),
      anon().from('positions').select('id, title').limit(1),
    ])
    expect(departments.error).toBeNull()
    expect(positions.error).toBeNull()
    expect(departments.data?.length).toBeGreaterThan(0)
    expect(positions.data?.length).toBeGreaterThan(0)
  })
})

describe('identity contract', () => {
  it('exposes no user rows to an anonymous visitor', async () => {
    const { data, error } = await anon().from('users').select('id, email')
    expect(error !== null || (data ?? []).length === 0).toBe(true)
  })

  it('exposes no profile rows to an anonymous visitor', async () => {
    const { data, error } = await anon().from('profiles').select('id, email')
    expect(error !== null || (data ?? []).length === 0).toBe(true)
  })
})

describe('authorization contract', () => {
  // Anonymous callers legitimately resolve to no roles and no permissions.
  // The contract under test is that the helpers exist and are callable —
  // Track 3's AuthProvider calls them on every sign-in. 42883 is
  // undefined_function: that would mean the helper is gone.
  it('exposes my_roles as a callable RPC', async () => {
    const { error } = await anon().rpc('my_roles')
    expect(error?.code).not.toBe('42883')
  })

  it('exposes my_permissions as a callable RPC', async () => {
    const { error } = await anon().rpc('my_permissions')
    expect(error?.code).not.toBe('42883')
  })
})
