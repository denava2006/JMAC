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

  // Note the press-and-hold syntax. `{ArrowDown}` presses and releases within
  // one turn, and Radix clears its select-on-focus flag on keyup — before
  // roving-focus's deferred focusFirst() runs on the next macrotask. The
  // selection would then silently not happen, which is not what a real key
  // press does. Holding the key keeps the flag set for the deferred focus.
  it('moves focus and selection with arrow keys', async () => {
    render(<Fixture />)
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Full time' })).toHaveFocus()

    await userEvent.keyboard('{ArrowDown>}')
    expect(screen.getByRole('radio', { name: 'Part time' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Part time' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Full time' })).not.toBeChecked()
    await userEvent.keyboard('{/ArrowDown}')
  })
})
