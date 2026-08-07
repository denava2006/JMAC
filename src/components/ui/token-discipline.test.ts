import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcDir = resolve(__dirname, '../..')
const uiDir = resolve(__dirname)

/** The one file allowed to hold brand hex values — it is where they are
 *  defined. Everything else must reach them through a semantic token. */
const TOKEN_SOURCE = join(srcDir, 'styles', 'tokens.css')

const SWEPT_EXTENSIONS = new Set(['.ts', '.tsx', '.css'])

function sweep(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sweep(path)
    if (!SWEPT_EXTENSIONS.has(extname(entry.name))) return []
    if (/\.test\.[cm]?[jt]sx?$/.test(entry.name)) return []
    if (entry.name.endsWith('.d.ts')) return []
    if (path === TOKEN_SOURCE) return []
    return [path]
  })
}

/** Recursive and src-wide on purpose. The first version of this guard swept
 *  only *.tsx directly inside components/ui, which left a Recharts palette in
 *  a .ts file and every future layout directory unpoliced. */
const sweptFiles = sweep(srcDir)
const relative = (path: string) => path.slice(srcDir.length + 1).replaceAll('\\', '/')
const cases = sweptFiles.map((path) => [relative(path), path] as const)

const componentFiles = readdirSync(uiDir).filter(
  (file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx')
)

// A hex colour, but not an anchor target (href="#pricing") or a DOM id.
const HEX = /(?<!href=["'])(?<!id=["'])#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z_-])/

// Raw palette utilities bypass the token layer as effectively as a hex
// literal: bg-slate-900 will not follow a brand change or a dark palette.
// `white` and `black` carry no numeric suffix, which is exactly why the
// first version of this pattern missed bg-white and text-white.
const PALETTE_PREFIX =
  'bg|text|border|ring|ring-offset|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration|shadow'
const PALETTE_FAMILY =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const PALETTE = new RegExp(
  `\\b(?:${PALETTE_PREFIX})-(?:(?:${PALETTE_FAMILY})-\\d{2,3}|white|black)\\b`
)

// An inline style setting a colour escapes Tailwind entirely, so neither of
// the patterns above would see it. Only literals are rejected: some third
// party components (Recharts' tooltip) accept styles and no className, and
// `backgroundColor: 'var(--color-surface)'` has not left the token layer --
// it is reaching the same variable a utility class would.
const INLINE_STYLE_COLOUR =
  /\b(?:color|background|backgroundColor|borderColor|fill|stroke|outlineColor|stopColor):\s*['"](?!var\()/

const COLOUR_FUNCTION = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/

// Reaching for a brand variable directly skips the semantic layer that spec
// section 5.1 exists to enforce: bg-[var(--jmac-navy)] will not follow a
// later decision to repoint --color-primary at something else.
const BRAND_VARIABLE = /--jmac-/

describe('token discipline', () => {
  it('sweeps the whole of src, not one directory', () => {
    expect(sweptFiles.length).toBeGreaterThanOrEqual(20)
    expect(sweptFiles.some((path) => path.includes(join('components', 'ui')))).toBe(true)
  })

  it.each(cases)('%s contains no hex colour literal', (_name, path) => {
    expect(readFileSync(path, 'utf8')).not.toMatch(HEX)
  })

  it.each(cases)('%s uses no raw Tailwind palette colour', (_name, path) => {
    expect(readFileSync(path, 'utf8')).not.toMatch(PALETTE)
  })

  it.each(cases)('%s sets no colour through an inline style', (_name, path) => {
    expect(readFileSync(path, 'utf8')).not.toMatch(INLINE_STYLE_COLOUR)
  })

  it.each(cases)('%s calls no raw colour function', (_name, path) => {
    expect(readFileSync(path, 'utf8')).not.toMatch(COLOUR_FUNCTION)
  })

  it.each(cases)('%s reaches no brand variable directly', (_name, path) => {
    expect(readFileSync(path, 'utf8')).not.toMatch(BRAND_VARIABLE)
  })

  it('exports every component through the barrel', () => {
    const barrel = readFileSync(resolve(uiDir, 'index.ts'), 'utf8')
    for (const file of componentFiles) {
      expect(barrel).toContain(`'./${file.replace(/\.tsx$/, '')}'`)
    }
  })
})
