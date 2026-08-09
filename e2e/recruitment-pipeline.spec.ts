import { expect, test, type Page } from '@playwright/test'

/**
 * Full recruitment pipeline: apply publicly, track, screen, interview, hire.
 *
 * Unlike smoke.spec.ts this test WRITES. Each run creates one applicant, one
 * application, two interviews and their history rows in the jmac-suite
 * database, and leaves them behind — there is no anonymous delete path, and the
 * pipeline is only meaningful end to end. Every run uses a fresh timestamped
 * email so runs never collide with each other.
 *
 * It is the regression net for Recruitment Slices 1-3: the public Apply flow,
 * the applicant tracker, HR screening, and both interview rounds.
 */
const STAMP = Date.now().toString().slice(-8)
const EMAIL = `pipeline${STAMP}@example.com`
const FIRST_NAME = 'Pipeline'
const MIDDLE_NAME = 'Test'
const LAST_NAME = 'Candidate'

const ADMIN_EMAIL = process.env.E2E_EMAIL ?? 'admin@jmac.com'
const ADMIN_PASSWORD = process.env.E2E_PASSWORD ?? 'Admin123'

const TINY_PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')

/** `datetime-local` wants YYYY-MM-DDTHH:mm in local time. */
function localDatetime(daysAhead: number, hour: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  date.setHours(hour, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Picks an option from a Radix Select by its trigger id. */
async function chooseOption(page: Page, triggerId: string, optionName: string) {
  await page.locator(`#${triggerId}`).click()
  await page.getByRole('option', { name: optionName, exact: true }).click()
}

/** Opens the first posting that is still accepting applications.
 *
 *  The careers list also shows open postings whose closing date has passed —
 *  those render a "no longer accepting" notice instead of the Apply button, so
 *  the first card is not necessarily appliable. */
async function openAcceptingRole(page: Page) {
  await page.goto('/careers')
  // The list renders skeletons first; count only once real cards are present.
  await expect(
    page.getByRole('link', { name: 'View role' }).first(),
    'no open job postings to apply to'
  ).toBeVisible()
  const roleCount = await page.getByRole('link', { name: 'View role' }).count()

  for (let index = 0; index < roleCount; index++) {
    await page.goto('/careers')
    await page.getByRole('link', { name: 'View role' }).nth(index).click()
    await expect(page.getByRole('link', { name: 'Back to careers' })).toBeVisible()

    const apply = page.getByRole('link', { name: 'Apply for this role' })
    if ((await apply.count()) > 0) {
      await apply.click()
      return
    }
  }
  throw new Error('No open posting is currently accepting applications.')
}

/** Closes the evaluation/schedule dialog and the drawer, then reopens the row.
 *  Each mutation invalidates the queue, so the row must be re-selected from
 *  fresh data rather than reusing a stale drawer. */
async function reopenQueueRow(page: Page) {
  // A successful mutation closes its own dialog but leaves the drawer open,
  // and both report role="dialog" — close whatever remains before reselecting.
  for (let attempt = 0; attempt < 3 && (await page.getByRole('dialog').count()) > 0; attempt++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByText(EMAIL).click()
}

test('applicant is hired through the full recruitment pipeline', async ({ page }) => {
  test.setTimeout(180_000)

  // ---- Slice 1: public application -------------------------------------
  await openAcceptingRole(page)

  await expect(page.getByRole('heading', { name: 'Apply for this role' })).toBeVisible()
  await page.getByLabel(/First name/).fill(FIRST_NAME)
  await page.getByLabel(/Middle name/).fill(MIDDLE_NAME)
  await page.getByLabel(/Last name/).fill(LAST_NAME)
  await page.getByLabel(/Email address/).fill(EMAIL)
  await page.getByLabel(/Phone number/).fill('09171234567')

  // Province -> City -> Barangay cascade, taking the first option at each level.
  const combos = page.getByRole('combobox')
  for (const index of [0, 1, 2]) {
    await combos.nth(index).click()
    await page.getByRole('option').first().click()
  }

  await page.getByLabel(/Residential address/).fill('123 Pipeline Street')
  await page.setInputFiles('#resume', { name: 'resume.pdf', mimeType: 'application/pdf', buffer: TINY_PDF })
  await page.getByRole('button', { name: /Submit application/ }).click()

  await expect(page.getByRole('heading', { name: 'Application submitted' })).toBeVisible()
  const reference = await page.getByText(/APP-\d{4}-\d{4}/).innerText()
  expect(reference).toMatch(/APP-\d{4}-\d{4}/)

  // ---- Applicant tracker: the new application reads as received ---------
  await page.getByRole('link', { name: 'Track this application' }).click()
  // The tracker fires lookup_application on arrival; the first call against a
  // cold PostgREST connection can take well over the default 5s assertion.
  await expect(page.getByText('Application received', { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(reference, { exact: true })).toBeVisible()

  // ---- Slice 2: HR screening -------------------------------------------
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard')

  await page.goto('/dashboard/recruitment')
  await page.getByText(EMAIL).click()
  await expect(page.getByRole('button', { name: 'View résumé' })).toBeVisible()
  await page.getByRole('button', { name: 'Qualify' }).click()
  await expect(page.getByText('Applicant qualified')).toBeVisible()

  // ---- Slice 3: initial interview --------------------------------------
  await page.goto('/dashboard/interviews')
  await expect(page.getByRole('heading', { name: 'Interviews', exact: true })).toBeVisible()
  await page.getByText(EMAIL).click()

  await page.getByRole('button', { name: 'Schedule initial interview' }).click()
  await page.getByLabel('Date and time').fill(localDatetime(7, 10))
  await chooseOption(page, 'initial-mode', 'Online')
  await page.getByLabel(/Meeting link/).fill('https://meet.example.com/initial')
  await page.getByRole('button', { name: 'Schedule interview' }).click()

  // Assert the durable state the drawer offers next, not the transient toast:
  // an initial interview now exists, so the only action left is recording it.
  await reopenQueueRow(page)
  await expect(page.getByRole('button', { name: 'Record initial result' })).toBeVisible()

  // Pass the initial round and hand the applicant to a final interviewer.
  await page.getByRole('button', { name: 'Record initial result' }).click()
  await chooseOption(page, 'initial-decision', 'Pass')
  await page.locator('#final-interviewer').click()
  await page.getByRole('option').first().click()
  await page.getByRole('button', { name: 'Record pass' }).click()

  // ---- Slice 3: final interview ----------------------------------------
  // Passing the initial round is what unlocks scheduling the final one.
  await reopenQueueRow(page)
  await page.getByRole('button', { name: 'Schedule final interview' }).click()
  await page.getByLabel('Date and time').fill(localDatetime(9, 10))
  await chooseOption(page, 'final-mode', 'Online')
  await page.getByLabel(/Meeting link/).fill('https://meet.example.com/final')
  await page.getByRole('button', { name: 'Schedule interview' }).click()

  await reopenQueueRow(page)
  await expect(page.getByRole('button', { name: 'Record final result' })).toBeVisible()
  await page.getByRole('button', { name: 'Record final result' }).click()
  await chooseOption(page, 'final-decision', 'Pass')
  await page.getByRole('button', { name: 'Record pass' }).click()

  // ---- The applicant is hired ------------------------------------------
  for (let attempt = 0; attempt < 3 && (await page.getByRole('dialog').count()) > 0; attempt++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  // Assert on the row itself: "Hired" appears on both the status cell and the
  // badge inside it, so a text locator would match two nodes.
  await expect(page.getByRole('row').filter({ hasText: EMAIL })).toContainText('Hired')
})
