import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('drops falsy values', () => {
    expect(cn('px-2', false, undefined, null, 'py-1')).toBe('px-2 py-1')
  })

  it('lets a later Tailwind class win over an earlier conflicting one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('lets a caller className override a component default', () => {
    expect(cn('bg-surface text-body', 'bg-primary')).toBe('text-body bg-primary')
  })

  it('resolves conditional object syntax', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })
})
