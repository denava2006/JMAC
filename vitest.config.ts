import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const env = loadEnv('test', process.cwd(), 'VITE_')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/integration/**', 'tests/db/**'],
    env: {
      // Fallbacks so the unit suite runs on a fresh clone or in CI, where the
      // git-ignored .env does not exist. src/lib/supabase.ts throws at import
      // time when either variable is missing, so without these the first test
      // that transitively imports it fails during collection rather than for
      // any reason to do with the test. A real .env still takes precedence.
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:56321',
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ?? 'test-anon-key',
    },
  },
})
