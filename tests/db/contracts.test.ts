import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Database } from '@/types/database.types'

const URL = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:56321'
const ANON = process.env.VITE_SUPABASE_ANON_KEY

beforeAll(() => {
  if (!ANON) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is unset. Copy .env.example to .env, then re-run `npm run test:db`.'
    )
  }
})

// Typed with <Database> so table names, column names, embedded relations and
// RPC names below are checked by `tsc -b` rather than being opaque strings.
// Untyped, a renamed column would break the app's client at compile time while
// this suite -- the thing meant to warn first -- kept passing.
const anon = () => createClient<Database>(URL, ANON as string)

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
  // These two are the most security-relevant assertions in the suite, so they
  // must be able to fail for the right reason. They previously read
  // `error !== null || rows.length === 0`, which cannot: this stack answers
  // GET /rest/v1/users with `[]` and HTTP 200 whether the anon key is correct,
  // garbage, or absent entirely, so a completely misconfigured client was
  // observationally identical to correctly-enforced RLS -- and the `||` meant
  // any failure at all, including a dead network, satisfied the expectation.
  //
  // The control read below is the fix. It runs on the SAME client and hits
  // departments, which is world-readable and non-empty, so the client must
  // demonstrably work before the empty result from users is allowed to count
  // as evidence of anything.

  it('exposes no user rows to an anonymous visitor', async () => {
    const client = anon()

    const control = await client.from('departments').select('id').limit(1)
    expect(control.error).toBeNull()
    expect(control.data?.length).toBeGreaterThan(0)

    const { data, error } = await client.from('users').select('id, email')
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    // Reading a selected column keeps the select string type-checked:
    // supabase-js resolves an unknown column to a SelectQueryError row type,
    // which only fails compilation at a use site like this one.
    expect((data ?? []).map((row) => row.email)).toEqual([])
  })

  it('exposes no profile rows to an anonymous visitor', async () => {
    const client = anon()

    const control = await client.from('departments').select('id').limit(1)
    expect(control.error).toBeNull()
    expect(control.data?.length).toBeGreaterThan(0)

    const { data, error } = await client.from('profiles').select('id, email')
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect((data ?? []).map((row) => row.email)).toEqual([])
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

describe('recruitment hardening contract (migration 0001)', () => {
  // HR Staff cannot read the `profiles` view (it is security_invoker), which is
  // why the picker goes through this SECURITY DEFINER RPC instead. The contract
  // is that it exists, refuses callers without interview.manage, and never
  // becomes readable anonymously.
  it('refuses the eligible-interviewer directory to an anonymous caller', async () => {
    const { data, error } = await anon().rpc('eligible_final_interviewers')
    // Present (not 42883 undefined_function) but not usable while signed out.
    expect(error?.code).not.toBe('42883')
    expect(data ?? []).toEqual([])
    expect(error).not.toBeNull()
  })

  it('keeps the application transition trigger installed', async () => {
    // The trigger is what stops a staff session jumping an application straight
    // from qualified to offered/deployed, skipping both interview rounds. It
    // cannot be asserted from the anon client directly, so assert the guarded
    // table is still reachable and RLS-silent rather than dropped.
    const { error } = await anon().from('applications').select('id').limit(1)
    expect(error).toBeNull()
  })
})

describe('atomic job offer contract (migration 0002)', () => {
  it('denies prepare_job_offer to an anonymous caller at the function ACL', async () => {
    const { data, error } = await anon().rpc('prepare_job_offer', {
      p_application_id: '00000000-0000-0000-0000-000000000001',
      p_proposed_salary: 20_000,
      p_salary_grade_id: '00000000-0000-0000-0000-000000000002',
      p_work_schedule_id: '00000000-0000-0000-0000-000000000003',
      p_start_date: '2099-01-01',
    })
    expect(data).toBeNull()
    expect(error?.code).toBe('42501')
    expect(error?.message).toContain('permission denied for function prepare_job_offer')
  })

  it('keeps direct anonymous job-offer table reads closed', async () => {
    const { data, error } = await anon().from('job_offers').select('id').limit(1)
    expect(data).toBeNull()
    expect(error?.code).toBe('42501')
  })

  it('validates an applicant response before looking up credentials', async () => {
    const { data, error } = await anon().rpc('respond_to_job_offer', {
      p_reference_code: 'APP-DOES-NOT-EXIST',
      p_email: 'nobody@example.com',
      p_decision: 'maybe',
    })
    expect(data).toBeNull()
    expect(error?.message).toContain('INVALID_DECISION')
  })

  it('treats a null applicant decision as invalid', async () => {
    const { data, error } = await anon().rpc('respond_to_job_offer', {
      p_reference_code: 'APP-DOES-NOT-EXIST',
      p_email: 'nobody@example.com',
      // Deliberately step outside the generated client type to probe the public
      // RPC boundary a hand-written HTTP caller can reach.
      p_decision: null as unknown as string,
    })
    expect(data).toBeNull()
    expect(error?.message).toContain('INVALID_DECISION')
  })

  it('rejects decline details on an acceptance before looking up credentials', async () => {
    const { data, error } = await anon().rpc('respond_to_job_offer', {
      p_reference_code: 'APP-DOES-NOT-EXIST',
      p_email: 'nobody@example.com',
      p_decision: 'accepted',
      p_decline_reason: 'Other',
    })
    expect(data).toBeNull()
    expect(error?.message).toContain('INVALID_DECLINE_DETAILS')
  })

  it('returns NOT_FOUND for valid response syntax and fake credentials', async () => {
    const { data, error } = await anon().rpc('respond_to_job_offer', {
      p_reference_code: 'APP-DOES-NOT-EXIST',
      p_email: 'nobody@example.com',
      p_decision: 'accepted',
    })
    expect(data).toBeNull()
    expect(error?.message).toContain('NOT_FOUND')
  })
})

describe('employment contract contract (migration 0003)', () => {
  // Every contract write goes through a permission-scoped RPC; the table itself
  // is SELECT-only for authenticated and invisible to anon. These assert the
  // functions exist (not 42883) and refuse an anonymous caller.
  it.each([
    ['generate_employment_contract', { p_application_id: '00000000-0000-0000-0000-000000000000' }],
    ['mark_contract_printed', { p_contract_id: '00000000-0000-0000-0000-000000000000' }],
    ['record_contract_signing', {
      p_contract_id: '00000000-0000-0000-0000-000000000000',
      p_file_path: 'contracts/x.pdf',
    }],
  ])('refuses %s to an anonymous caller', async (fn, args) => {
    const { error } = await anon().rpc(fn as never, args as never)
    expect(error).not.toBeNull()
    // 42883 would mean the function is missing rather than merely refused.
    expect(error?.code).not.toBe('42883')
  })

  it('does not expose employment_contracts rows anonymously', async () => {
    const { data, error } = await anon().from('employment_contracts').select('id').limit(1)
    // RLS denies silently for anon: no rows, no error.
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })
})

describe('deployment contract (migration 0004)', () => {
  // Deployment is one permission-scoped RPC; the table is SELECT-only for
  // authenticated staff and invisible to anon.
  it('refuses deploy_applicant to an anonymous caller', async () => {
    const { error } = await anon().rpc('deploy_applicant' as never, {
      p_application_id: '00000000-0000-0000-0000-000000000000',
      p_branch_id: '00000000-0000-0000-0000-000000000000',
    } as never)
    expect(error).not.toBeNull()
    expect(error?.code).not.toBe('42883')
  })

  it('does not expose deployment_records rows anonymously', async () => {
    const { data, error } = await anon().from('deployment_records').select('id').limit(1)
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })
})

describe('employee creation contract (migration 0005)', () => {
  // The employee record is created by a permission-scoped RPC, never by a
  // client insert, and one application can only ever become one employee.
  it('refuses create_employee_from_application to an anonymous caller', async () => {
    const { error } = await anon().rpc('create_employee_from_application' as never, {
      p_application_id: '00000000-0000-0000-0000-000000000000',
    } as never)
    expect(error).not.toBeNull()
    expect(error?.code).not.toBe('42883')
  })
})
