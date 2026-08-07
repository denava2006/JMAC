import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')

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
  '--jmac-line': '#E2E8F0',
  '--jmac-body': '#64748B',
  '--jmac-success': '#22C55E',
  '--jmac-warning': '#F59E0B',
  '--jmac-error': '#EF4444',
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
