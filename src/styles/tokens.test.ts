import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'

const tokensPath = resolve(__dirname, 'tokens.css')
const tokens = readFileSync(tokensPath, 'utf8')

const SEMANTIC_TOKENS = [
  '--color-background',
  '--color-surface',
  '--color-border',
  '--color-primary',
  '--color-primary-hover',
  '--color-primary-foreground',
  '--color-accent',
  '--color-heading',
  '--color-body',
  '--color-muted',
  '--color-success',
  '--color-warning',
  '--color-error',
  '--color-ring',
]

const BRAND_VALUES: Record<string, string> = {
  '--jmac-navy': '#0F172A',
  '--jmac-blue': '#1D4ED8',
  '--jmac-sky': '#38BDF8',
  '--jmac-canvas': '#F8FAFC',
  '--jmac-surface': '#FFFFFF',
  '--jmac-mist': '#F1F5F9',
  '--jmac-line': '#E2E8F0',
  '--jmac-body': '#64748B',
  '--jmac-success': '#22C55E',
  '--jmac-warning': '#F59E0B',
  '--jmac-error': '#EF4444',
  '--jmac-on-dark': '#FFFFFF',
  '--jmac-on-light': '#0F172A',
}

describe('design tokens', () => {
  it.each(SEMANTIC_TOKENS)('exposes %s in the @theme layer', (token) => {
    expect(tokens).toContain(`${token}:`)
  })

  it.each(Object.entries(BRAND_VALUES))('defines %s as %s', (name, value) => {
    expect(tokens).toMatch(new RegExp(`${name}:\\s*${value};`, 'i'))
  })

  it('routes every semantic colour through a brand variable, never a raw hex', () => {
    const themeBlock = tokens.slice(tokens.indexOf('@theme inline'))
    expect(themeBlock).not.toMatch(/#[0-9a-f]{3,8}/i)
  })

  it('declares the radius scale', () => {
    expect(tokens).toMatch(/--radius:\s*0\.5rem;/)
  })
})

// Everything above matches strings in tokens.css. That is not enough on its
// own: the --shadow-* trio was declared in :root rather than in an @theme
// block for the whole of Track 1, so Tailwind never saw it and .shadow-sm
// shipped Tailwind's stock (much heavier) default -- while every assertion
// above passed. These tests compile the real stylesheet with Tailwind and
// assert the utilities components will actually receive.
const require = createRequire(import.meta.url)
const tailwindEntry = resolve(
  dirname(require.resolve('tailwindcss/package.json')),
  'index.css'
)

async function loadStylesheet(id: string, base: string) {
  const path = id === 'tailwindcss' ? tailwindEntry : resolve(base, id)
  return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
}

const UTILITIES = [
  'bg-background',
  'bg-surface',
  'bg-muted',
  'bg-primary',
  'bg-accent',
  'text-primary-foreground',
  'text-accent-foreground',
  'text-warning-foreground',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
]

describe('compiled Tailwind utilities', () => {
  let css = ''

  beforeAll(async () => {
    const compiler = await compile(`@import 'tailwindcss';\n${tokens}`, {
      base: dirname(tokensPath),
      loadStylesheet,
    })
    css = compiler.build(UTILITIES)
  })

  const rule = (selector: string) => {
    const start = css.indexOf(`${selector} {`)
    expect(start, `${selector} was not emitted by Tailwind`).toBeGreaterThan(-1)
    return css.slice(start, css.indexOf('}', start) + 1)
  }

  it('resolves .bg-primary to the navy brand variable', () => {
    expect(rule('.bg-primary')).toContain('var(--jmac-navy)')
  })

  it('resolves .bg-accent to the sky brand variable', () => {
    expect(rule('.bg-accent')).toContain('var(--jmac-sky)')
  })

  // Finding 7: --color-muted used to alias --jmac-canvas, making bg-muted
  // invisible against the page. Skeleton, EmptyState, inactive Tabs and table
  // zebra striping all depend on these two resolving differently.
  it('gives .bg-muted a surface distinguishable from .bg-background', () => {
    const muted = rule('.bg-muted')
    const background = rule('.bg-background')
    expect(muted).toContain('var(--jmac-mist)')
    expect(background).toContain('var(--jmac-canvas)')
    expect(muted.replace('.bg-muted', '')).not.toBe(
      background.replace('.bg-background', '')
    )
  })

  // Finding 8: foreground tokens must not alias surface brand variables, or a
  // future dark palette flips button text along with the card colour.
  it('routes foreground utilities through the on-dark/on-light variables', () => {
    expect(rule('.text-primary-foreground')).toContain('var(--jmac-on-dark)')
    expect(rule('.text-accent-foreground')).toContain('var(--jmac-on-light)')
    expect(rule('.text-warning-foreground')).toContain('var(--jmac-on-light)')
  })

  // Finding 1: this is the assertion whose absence let the dead shadow scale
  // ship. Tailwind resolves shadow values at build time, so the only proof is
  // the compiled declaration.
  it.each([
    ['.shadow-sm', '0 1px 2px 0', 'rgb(15 23 42 / 0.04)'],
    ['.shadow-md', '0 2px 8px -1px', 'rgb(15 23 42 / 0.08)'],
    ['.shadow-lg', '0 8px 24px -4px', 'rgb(15 23 42 / 0.10)'],
  ])('compiles %s to the JMAC elevation value', (selector, geometry, colour) => {
    const declaration = rule(selector)
    expect(declaration).toContain(geometry)
    expect(declaration).toContain(colour)
  })

  it('does not fall back to any of Tailwind stock shadow scale', () => {
    // Tailwind's defaults are all rgb(0 0 0 / ...). JMAC's are all slate-900.
    for (const selector of ['.shadow-sm', '.shadow-md', '.shadow-lg']) {
      expect(rule(selector)).not.toContain('rgb(0 0 0')
    }
  })
})
