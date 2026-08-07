import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

describe('database safety posture', () => {
  it('does not manage the jmac-suite stack', () => {
    // A supabase/config.toml here would put `supabase db reset` one command
    // away from dropping 70 tables of live data that no migration set on this
    // host can rebuild. See spec section 3.1.
    expect(existsSync(resolve(root, 'supabase'))).toBe(false)
  })

  it('ships no script that can rewrite or drop the stack', () => {
    // The Supabase CLI is a devDependency and package.json carries the
    // superuser connection string, so `supabase db reset --db-url ...` is
    // always available to anyone who adds a script for it. This asserts the
    // repository never ships that convenience -- read-only `gen types` only.
    const { scripts } = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8')
    ) as { scripts: Record<string, string> }

    const destructive = Object.entries(scripts).filter(([, command]) =>
      /supabase\s+(db\s+(reset|push|dump)|start|stop|init|link)/.test(command)
    )

    expect(destructive).toEqual([])
  })
})
