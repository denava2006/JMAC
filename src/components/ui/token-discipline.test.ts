import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const uiDir = resolve(__dirname)
const componentFiles = readdirSync(uiDir).filter(
  (file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx')
)

describe('token discipline', () => {
  it('found the component files it is meant to police', () => {
    expect(componentFiles.length).toBeGreaterThanOrEqual(14)
  })

  it.each(componentFiles)('%s contains no hex colour literal', (file) => {
    const source = readFileSync(resolve(uiDir, file), 'utf8')
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  // Raw palette utilities bypass the token layer just as effectively as a hex
  // literal: bg-slate-900 will not follow a dark palette or a brand change.
  it.each(componentFiles)('%s uses no raw Tailwind palette colour', (file) => {
    const source = readFileSync(resolve(uiDir, file), 'utf8')
    const palette =
      /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/
    expect(source).not.toMatch(palette)
  })

  it('exports every component through the barrel', () => {
    const barrel = readFileSync(resolve(uiDir, 'index.ts'), 'utf8')
    for (const file of componentFiles) {
      expect(barrel).toContain(`'./${file.replace(/\.tsx$/, '')}'`)
    }
  })
})
