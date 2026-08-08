import { expect, test, type Page } from '@playwright/test'

/**
 * JMAC Enterprise smoke tests.
 *
 * Read-only end-to-end checks: sign in as a demo account and confirm the app
 * boots, routes, and renders its shell. They assert on structure and labels,
 * never on data values — an employee count or a revenue figure changes as the
 * demo database is used, and a smoke test that pins those numbers goes red for
 * reasons that have nothing to do with the app being broken.
 *
 * Nothing here writes to the database. There is no POS checkout and no finance
 * flow yet — those come with their modules.
 *
 * Credentials default to the local system-administrator demo account (it sees
 * every dashboard card, including the HR ones). Override with E2E_EMAIL /
 * E2E_PASSWORD if you seed different accounts.
 */
const EMAIL = process.env.E2E_EMAIL ?? 'admin@jmac.com'
const PASSWORD = process.env.E2E_PASSWORD ?? 'Admin123'

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // The router lands on /dashboard once the session and its permissions load.
  await page.waitForURL('**/dashboard')
}

test.describe('JMAC smoke', () => {
  test('the login page renders when signed out', async ({ page }) => {
    // The most stable check there is: no auth, no data — it only proves the
    // app boots and serves the sign-in form.
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sign in to JMAC' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    // The fix that was added earlier: a way back to the public site.
    await expect(page.getByRole('link', { name: /Back to home/ })).toBeVisible()
  })

  test('the dashboard loads after signing in', async ({ page }) => {
    await signIn(page)
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
  })

  test('the sidebar navigation is visible', async ({ page }) => {
    await signIn(page)
    const nav = page.getByRole('navigation', { name: 'Main' })
    await expect(nav).toBeVisible()
    // Dashboard is the one entry every signed-in role sees.
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    // The People section groups the HR pages; its heading proves the grouped
    // navigation rendered, not just a flat list.
    await expect(nav.getByText('People', { exact: true })).toBeVisible()
  })

  test('the HRMS dashboard cards render', async ({ page }) => {
    await signIn(page)
    // Assert the tiles are present by their labels, not their numbers. These
    // three are the HR-facing metrics; the admin account holds the permissions
    // that surface them.
    await expect(page.getByText('Active employees')).toBeVisible()
    await expect(page.getByText('Present today')).toBeVisible()
    await expect(page.getByText('Leave awaiting review')).toBeVisible()
  })
})
