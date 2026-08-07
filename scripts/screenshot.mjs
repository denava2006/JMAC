import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

/** Screenshots the running dev server at three widths.
 *
 *  jsdom does no layout, so the unit suite cannot see a clipped dropdown, a
 *  chart at zero height, or a page that scrolls sideways on a phone. Track 2A
 *  shipped a Select whose viewport was clamped to one row and seven reviews
 *  missed it; this is where that class of bug is visible.
 *
 *  Usage: npm run dev, then `npm run shots [url] [outDir]`
 */
const URL = process.argv[2] ?? 'http://localhost:5173'
const OUT = process.argv[3] ?? 'screenshots'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const findings = []

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await context.newPage()

  page.on('console', (m) => m.type() === 'error' && findings.push(`[${vp.name}] console: ${m.text()}`))
  page.on('pageerror', (e) => findings.push(`[${vp.name}] pageerror: ${e.message}`))

  await page.goto(URL, { waitUntil: 'networkidle' })
  // Recharts animates bars in over 1500ms. Screenshotting sooner catches the
  // chart mid-growth and reads as "the chart has no bars".
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/${vp.name}.png`, fullPage: true })

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  if (overflow > 0) findings.push(`[${vp.name}] page scrolls sideways by ${overflow}px`)

  await context.close()
}

await browser.close()
console.log(`Wrote ${VIEWPORTS.length} screenshots to ${OUT}/`)
console.log(findings.length ? findings.join('\n') : 'No console errors, no horizontal overflow.')
process.exit(findings.length ? 1 : 0)
