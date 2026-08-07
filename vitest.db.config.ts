import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const env = loadEnv('development', process.cwd(), 'VITE_')

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    testTimeout: 20_000,
    env,
  },
})
