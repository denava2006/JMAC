import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const env = loadEnv('development', process.cwd(), 'VITE_')

export default defineConfig({
  // Same '@' alias as vitest.config.ts. Without it, a contract test importing
  // anything under src/ resolves differently here than in the unit suite.
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    testTimeout: 20_000,
    // Deliberately no fallback key here, unlike vitest.config.ts: these tests
    // talk to the real jmac-suite stack, and a placeholder would turn a
    // missing .env into confusing connection failures instead of the explicit
    // error tests/db/contracts.test.ts raises in beforeAll.
    env,
  },
})
