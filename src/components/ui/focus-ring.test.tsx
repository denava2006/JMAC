import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// Same three stubs select.test.tsx needs: Radix Select drives its popper with
// pointer-capture and scroll APIs jsdom does not implement.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

/** Keyboard users navigate by the ring. The plan makes "every interactive
 *  component shows a visible focus ring" a global constraint, and the colour
 *  rule got an automated guard while this one had nothing — so the first
 *  component to forget it would have shipped green. Sixteen more components
 *  arrive in Track 2B; this is what stops the omission being silent. */
const RING_CLASSES = [
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-ring',
  'focus-visible:ring-offset-2',
]

const cases: Array<[string, () => HTMLElement]> = [
  [
    'Button',
    () => {
      render(<Button>Save</Button>)
      return screen.getByRole('button')
    },
  ],
  [
    'Input',
    () => {
      render(<Input aria-label="Email" />)
      return screen.getByLabelText('Email')
    },
  ],
  [
    'Textarea',
    () => {
      render(<Textarea aria-label="Notes" />)
      return screen.getByLabelText('Notes')
    },
  ],
  [
    'Checkbox',
    () => {
      render(<Checkbox aria-label="Accept" />)
      return screen.getByRole('checkbox')
    },
  ],
  [
    'RadioGroupItem',
    () => {
      render(
        <RadioGroup aria-label="Type">
          <RadioGroupItem value="a" aria-label="Option A" />
        </RadioGroup>
      )
      return screen.getByRole('radio')
    },
  ],
  [
    'Switch',
    () => {
      render(<Switch aria-label="Notifications" />)
      return screen.getByRole('switch')
    },
  ],
  [
    'SelectTrigger',
    () => {
      render(
        <Select>
          <SelectTrigger aria-label="Department">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
        </Select>
      )
      return screen.getByRole('combobox')
    },
  ],
]

describe('focus ring', () => {
  it.each(cases)('%s carries every ring class', (_name, renderComponent) => {
    const element = renderComponent()
    for (const className of RING_CLASSES) {
      expect(element).toHaveClass(className)
    }
  })
})

describe('barrel export', () => {
  // token-discipline.test.ts checks the barrel's file *text*. This actually
  // imports it, which is what proves the components are reachable the way
  // every later track will reach them.
  it('exposes all 14 components through @/components/ui', async () => {
    const ui = await import('@/components/ui')
    const expected = [
      'Avatar',
      'AvatarFallback',
      'AvatarImage',
      'Badge',
      'Button',
      'Checkbox',
      'EmptyState',
      'ErrorState',
      'Input',
      'Label',
      'Loader',
      'RadioGroup',
      'RadioGroupItem',
      'Select',
      'SelectContent',
      'SelectItem',
      'SelectTrigger',
      'SelectValue',
      'Skeleton',
      'Switch',
      'Textarea',
    ]
    for (const name of expected) {
      expect(ui[name as keyof typeof ui], `${name} is missing from the barrel`).toBeDefined()
    }
  })
})
