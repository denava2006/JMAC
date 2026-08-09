import { expect, test, type Page, type Route } from '@playwright/test'

const REFERENCE = 'APP-2026-OFFER'
const APPLICANT_EMAIL = 'offer.candidate@example.com'
const HR_EMAIL = process.env.E2E_HR_EMAIL ?? 'admin@jmac.com'
const HR_PASSWORD = process.env.E2E_HR_PASSWORD ?? 'Admin123'

type OfferStatus = 'pending' | 'accepted' | 'declined'

function localIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function daysFromToday(days: number): string {
  const value = new Date()
  value.setDate(value.getDate() + days)
  return localIsoDate(value)
}

function trackedOffer(status: OfferStatus) {
  return {
    reference_code: REFERENCE,
    status: 'offered',
    submitted_at: '2026-08-01T08:00:00.000Z',
    applicant_name: 'Offer Test Candidate',
    position_title: 'Store Supervisor',
    department_name: 'Operations',
    interview_type: null,
    interview_scheduled_at: null,
    interview_mode: null,
    interview_location: null,
    interview_meeting_link: null,
    interview_status: null,
    offer_id: '11111111-1111-4111-8111-111111111111',
    offer_status: status,
    offer_employment_type: 'regular',
    offer_salary: 22_500,
    offer_currency: 'PHP',
    offer_start_date: '2026-09-01',
    offer_working_hours: '8:00 AM - 5:00 PM',
    offer_working_days: 'Monday, Tuesday, Wednesday, Thursday, Friday',
    offer_benefits: 'Government benefits and health coverage',
    offer_additional_compensation: 'Performance incentive',
  }
}

async function json(route: Route, body: unknown, headers: Record<string, string> = {}) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(body),
  })
}

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function expectHealthyPage(page: Page, errors: string[]) {
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  expect(errors).toEqual([])
}

async function blockUnexpectedDataWrites(page: Page): Promise<string[]> {
  const writes: string[] = []
  await page.route('**/rest/v1/**', async (route) => {
    const method = route.request().method()
    const pathname = new URL(route.request().url()).pathname
    const readOnlyRpc = [
      '/rest/v1/rpc/my_permissions',
      '/rest/v1/rpc/my_roles',
      '/rest/v1/rpc/my_modules',
    ].includes(pathname)
    if (method === 'GET' || method === 'HEAD' || readOnlyRpc) {
      await route.continue()
      return
    }
    writes.push(`${method} ${pathname}`)
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unexpected Data API write blocked by offer-flow.spec.ts' }),
    })
  })
  return writes
}

async function openTrackedOffer(page: Page, currentStatus: () => OfferStatus) {
  await page.route('**/rest/v1/rpc/lookup_application', (route) =>
    json(route, [trackedOffer(currentStatus())])
  )
  await page.goto('/careers/track')
  await expect(page.getByRole('heading', { name: 'Track your application' })).toBeVisible()
  await page.getByLabel('Reference number').fill(`  ${REFERENCE}  `)
  await page.getByLabel('Email address').fill(`  ${APPLICANT_EMAIL.toUpperCase()}  `)
  await page.getByRole('button', { name: 'Check status' }).click()
  await expect(page.getByText('Your job offer')).toBeVisible()
  await expect(page.getByText(/22,500\.00/)).toBeVisible()
  await expect(page.getByText('Government benefits and health coverage')).toBeVisible()
  await expect(page.getByText('Performance incentive')).toBeVisible()
}

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard')
}

test.describe('Increment A job offers', () => {
  test('an applicant can review and accept a pending offer', async ({ page }) => {
    const browserErrors = collectBrowserErrors(page)
    const unexpectedWrites = await blockUnexpectedDataWrites(page)
    let status: OfferStatus = 'pending'
    let responsePayload: Record<string, unknown> | null = null

    await page.route('**/rest/v1/rpc/respond_to_job_offer', async (route) => {
      responsePayload = route.request().postDataJSON() as Record<string, unknown>
      status = 'accepted'
      await json(route, 'accepted')
    })
    await openTrackedOffer(page, () => status)

    await page.getByRole('button', { name: 'Accept offer' }).click()
    await expect(page.getByText('Accepted', { exact: true })).toBeVisible()
    await expect(page.getByText('Your offer acceptance is recorded. HR will continue with the contract stage.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept offer' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Decline offer' })).toHaveCount(0)

    expect(responsePayload).toEqual({
      p_reference_code: REFERENCE,
      p_email: APPLICANT_EMAIL,
      p_decision: 'accepted',
    })
    expect(unexpectedWrites).toEqual([])
    await expectHealthyPage(page, browserErrors)
  })

  test('declining requires a reason and sends only the applicant response fields', async ({ page }) => {
    const browserErrors = collectBrowserErrors(page)
    const unexpectedWrites = await blockUnexpectedDataWrites(page)
    let status: OfferStatus = 'pending'
    let responsePayload: Record<string, unknown> | null = null

    await page.route('**/rest/v1/rpc/respond_to_job_offer', async (route) => {
      responsePayload = route.request().postDataJSON() as Record<string, unknown>
      status = 'declined'
      await json(route, 'declined')
    })
    await openTrackedOffer(page, () => status)

    await page.getByRole('button', { name: 'Decline offer' }).click()
    await page.getByRole('button', { name: 'Confirm decline' }).click()
    await expect(page.getByText('Choose a reason so HR can review your response.')).toBeVisible()
    expect(responsePayload).toBeNull()

    await page.locator('#offer-decline-reason').click()
    await page.getByRole('option', { name: 'Salary expectation', exact: true }).click()
    await page.getByLabel('Additional notes').fill('  Needs a higher salary range.  ')
    await page.getByRole('button', { name: 'Confirm decline' }).click()

    await expect(page.getByText('Declined', { exact: true })).toBeVisible()
    await expect(page.getByText(/Your response is recorded\. HR will review it/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept offer' })).toHaveCount(0)
    expect(responsePayload).toEqual({
      p_reference_code: REFERENCE,
      p_email: APPLICANT_EMAIL,
      p_decision: 'declined',
      p_decline_reason: 'Salary expectation',
      p_decline_notes: 'Needs a higher salary range.',
    })
    expect(unexpectedWrites).toEqual([])
    await expectHealthyPage(page, browserErrors)
  })

  test('HR prepares an offer through the atomic RPC without writing live recruitment data', async ({ page }) => {
    const browserErrors = collectBrowserErrors(page)
    const preparePayloads: Record<string, unknown>[] = []
    const salaryGradeUrls: URL[] = []
    const workScheduleUrls: URL[] = []
    let recruitmentStatus: 'hired' | 'offered' = 'hired'
    let recruitmentOfferStatus: 'declined' | null = null

    await signIn(page)
    const unexpectedWrites = await blockUnexpectedDataWrites(page)

    await page.route('**/rest/v1/applications*', async (route) => {
      if (route.request().method() === 'HEAD') {
        await route.fulfill({ status: 200, headers: { 'content-range': '0-0/1' }, body: '' })
        return
      }
      await json(route, [
        {
          id: '22222222-2222-4222-8222-222222222222',
          status: recruitmentStatus,
          rejection_reason: null,
          reviewed_at: '2026-08-01T08:00:00.000Z',
          created_at: '2026-08-01T08:00:00.000Z',
          applicant_id: '33333333-3333-4333-8333-333333333333',
          applicants: {
            first_name: 'Offer',
            middle_name: 'Test',
            last_name: 'Candidate',
            email: APPLICANT_EMAIL,
            phone: '09171234567',
            address: '123 Test Street',
            province: 'Metro Manila',
            city: 'Quezon City',
            barangay: 'Central',
            resume_url: null,
            cover_letter: 'Prepared for the offer flow test.',
          },
          job_postings: {
            employment_type: 'regular',
            positions: { title: 'Store Supervisor' },
            departments: { name: 'Operations' },
          },
          job_offers: recruitmentOfferStatus
            ? [{
                id: '66666666-6666-4666-8666-666666666666',
                status: recruitmentOfferStatus,
                created_at: '2026-08-09T08:00:00.000Z',
              }]
            : [],
        },
      ], { 'content-range': '0-0/1' })
    })
    await page.route('**/rest/v1/salary_grades*', (route) => {
      salaryGradeUrls.push(new URL(route.request().url()))
      return json(route, [
        {
          id: '44444444-4444-4444-8444-444444444444',
          grade_name: 'Regular Grade',
          employment_type: 'regular',
          min_salary: 18_000,
          max_salary: 25_000,
        },
      ])
    })
    await page.route('**/rest/v1/work_schedules*', (route) => {
      workScheduleUrls.push(new URL(route.request().url()))
      return json(route, [
        {
          id: '55555555-5555-4555-8555-555555555555',
          name: 'Office Regular',
          employment_type: 'regular',
          working_days: [1, 2, 3, 4, 5],
          start_time: '08:00:00',
          end_time: '17:00:00',
          is_default: true,
        },
      ])
    })
    await page.route('**/rest/v1/rpc/prepare_job_offer', async (route) => {
      preparePayloads.push(route.request().postDataJSON() as Record<string, unknown>)
      await json(route, '66666666-6666-4666-8666-666666666666')
    })

    await page.goto('/dashboard/recruitment')
    await expect(page.getByRole('heading', { name: 'Recruitment' })).toBeVisible()
    await page.getByRole('button', { name: 'View application' }).click()
    await page.getByRole('button', { name: 'Prepare job offer' }).click()
    await expect(page.getByRole('heading', { name: 'Prepare job offer' })).toBeVisible()
    await expect.poll(() => salaryGradeUrls.length).toBe(1)
    await expect.poll(() => workScheduleUrls.length).toBe(1)
    expect(salaryGradeUrls[0].searchParams.get('employment_type')).toBe('eq.regular')
    expect(workScheduleUrls[0].searchParams.get('employment_type')).toBe('eq.regular')

    await page.locator('#offer-salary-grade').click()
    await page.getByRole('option', { name: 'Regular Grade', exact: true }).click()
    await page.locator('#offer-work-schedule').click()
    await page.getByRole('option', { name: 'Office Regular (default)', exact: true }).click()
    await page.getByLabel('Monthly salary').fill('18000')
    await page.getByLabel('Start date').fill(daysFromToday(0))
    await page.getByRole('button', { name: 'Prepare job offer' }).click()
    await expect(page.getByText('Choose a start date of tomorrow or later.')).toBeVisible()
    expect(preparePayloads).toHaveLength(0)

    await page.getByLabel('Start date').fill(daysFromToday(7))
    await page.getByLabel('Monthly salary').fill('25000.01')
    await page.getByRole('button', { name: 'Prepare job offer' }).click()
    await expect(page.getByText(/Enter an amount from .*18,000\.00 to .*25,000\.00/)).toBeVisible()
    expect(preparePayloads).toHaveLength(0)

    await page.getByLabel('Monthly salary').fill('18000')
    await page.getByLabel('Benefits').fill('  Health coverage  ')
    await page.getByLabel('Additional compensation').fill('  Performance incentive  ')
    await page.getByLabel('Internal notes').fill('  Approved by HR  ')
    await page.getByRole('button', { name: 'Prepare job offer' }).click()

    await expect.poll(() => preparePayloads.length).toBe(1)
    expect(preparePayloads[0]).toEqual({
      p_application_id: '22222222-2222-4222-8222-222222222222',
      p_proposed_salary: 18_000,
      p_salary_grade_id: '44444444-4444-4444-8444-444444444444',
      p_work_schedule_id: '55555555-5555-4555-8555-555555555555',
      p_start_date: daysFromToday(7),
      p_benefits: 'Health coverage',
      p_additional_compensation: 'Performance incentive',
      p_notes: 'Approved by HR',
    })
    expect(preparePayloads[0]).not.toHaveProperty('p_employment_type')
    expect(preparePayloads[0]).not.toHaveProperty('p_currency')
    expect(preparePayloads[0]).not.toHaveProperty('p_working_days')
    expect(preparePayloads[0]).not.toHaveProperty('p_working_hours')
    expect(preparePayloads[0]).not.toHaveProperty('p_prepared_by')
    expect(unexpectedWrites).toEqual([])
    await expect(page.getByText('Job offer prepared', { exact: true })).toBeVisible()

    recruitmentStatus = 'offered'
    recruitmentOfferStatus = 'declined'
    await page.reload()
    await page.getByRole('button', { name: 'View application' }).click()
    await expect(page.getByRole('button', { name: 'Prepare revised offer' })).toBeVisible()
    await expectHealthyPage(page, browserErrors)
  })
})
