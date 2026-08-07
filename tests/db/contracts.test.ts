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
  it('lets an anonymous visitor query job_postings', async () => {
    const { error } = await anon().from('job_postings').select('id, status')
    expect(error).toBeNull()
  })

  it('exposes only open postings to an anonymous visitor', async () => {
    const { data } = await anon().from('job_postings').select('status')
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
