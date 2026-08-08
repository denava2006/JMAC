import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for JMAC Enterprise.
 *
 * These are end-to-end smoke tests that drive the real app in a browser
 * against the running jmac-suite Supabase stack. They are read-only: they sign
 * in and look at pages, never creating or changing data. Keep them that way —
 * the database must not be modified by a test run.
 *
 * Vitest (src unit tests, tests/db contract tests) and Playwright (e2e) are
 * kept apart: Playwright owns e2e/, and vitest.config.ts excludes it.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  /* Fail the build if a test.only is left in the source on CI. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:5175',
    /* A screenshot is only worth keeping when something failed. */
    screenshot: 'only-on-failure',
    /* Keep the full trace for a failed test so it can be opened in the trace
     *  viewer; passing runs keep nothing. */
    trace: 'retain-on-failure',
  },

  /* Chromium only for now. Firefox and WebKit can be added later once the
   *  smoke suite is stable. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Vite dev server on 5175 before the tests, and reuse one that is
   *  already listening there (so a dev server you started by hand is picked up
   *  instead of a second one being spawned). The stack the app talks to —
   *  jmac-suite on port 56321 — must already be running; Playwright starts the
   *  web app, not the database. */
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
