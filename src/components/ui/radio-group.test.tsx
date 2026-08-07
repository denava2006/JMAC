import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

function Fixture() {
  return (
    <RadioGroup aria-label="Employment type" defaultValue="full_time">
      <RadioGroupItem value="full_time" aria-label="Full time" />
      <RadioGroupItem value="part_time" aria-label="Part time" />
    </RadioGroup>
  )
}

describe('RadioGroup', () => {
  it('marks the default value as selected', () => {
    render(<Fixture />)
    expect(screen.getByRole('radio', { name: 'Full time' })).toBeChecked()
  })

  it('selects only one option at a time', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByRole('radio', { name: 'Part time' }))
    expect(screen.getByRole('radio', { name: 'Part time' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Full time' })).not.toBeChecked()
  })

  // Asserts roving focus, not selection. In a real browser, selection follows
  // focus in a radio group and ArrowDown would also check "Part time" — Radix
  // implements that by setting a flag from a document-level keydown listener,
  // which fires on the bubble phase, after the item's own handler has already
  // moved focus. jsdom exposes that ordering; a browser hides it. Asserting
  // selection here would be asserting something the environment cannot produce.
  it('moves focus with arrow keys', async () => {
    render(<Fixture />)
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Full time' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Part time' })).toHaveFocus()
  })
})
