import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const src = resolve(__dirname, '..')

/**
 * Modules that load before the first route renders.
 *
 * These are the app shell: everything here is in the initial bundle, on the
 * critical path of every visitor including one who only wants the login page.
 */
const EAGER_MODULES = [
  'app/App.tsx',
  'router/routes.tsx',
  'router/guards.tsx',
  'layouts/AppLayout.tsx',
  'layouts/AuthLayout.tsx',
  'layouts/Header.tsx',
  'layouts/Sidebar.tsx',
  'contexts/AuthContext.tsx',
]

/**
 * The barrel re-exports all 30 components, including the three heaviest
 * dependencies in the project: Recharts, TanStack Table, and react-day-picker.
 * An eager module importing `{ Toaster } from '@/components/ui'` creates a
 * static edge to every one of them.
 *
 * Measured, not theorised: App.tsx importing Toaster and TooltipProvider from
 * the barrel put the initial chunk at 1,065 kB. Importing them from
 * '@/components/ui/toast' and '@/components/ui/tooltip' took it to 650 kB —
 * 415 kB, on the path of someone who has not signed in yet.
 *
 * Lazily-loaded feature code may use the barrel freely; it is behind a
 * dynamic import and pays its own cost.
 */
describe('eager module imports', () => {
  it.each(EAGER_MODULES)('%s imports components by path, not through the barrel', (module) => {
    const source = readFileSync(resolve(src, module), 'utf8')
    expect(source).not.toMatch(/from ['"]@\/components\/ui['"]/)
  })

  it('is policing modules that actually exist', () => {
    for (const module of EAGER_MODULES) {
      expect(() => readFileSync(resolve(src, module), 'utf8')).not.toThrow()
    }
  })
})
