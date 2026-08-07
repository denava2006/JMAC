import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox', () => {
  it('toggles on click and reports its state', async () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' })
    expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('toggles with the space key', async () => {
    render(<Checkbox aria-label="Accept terms" />)
    await userEvent.tab()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('reports changes to the caller', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Accept" onCheckedChange={onCheckedChange} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('does not toggle when disabled', async () => {
    render(<Checkbox aria-label="Accept" disabled />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })
})
