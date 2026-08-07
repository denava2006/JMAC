import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from '@/components/ui/switch'

describe('Switch', () => {
  it('toggles on click', async () => {
    render(<Switch aria-label="Email notifications" />)
    const control = screen.getByRole('switch', { name: 'Email notifications' })
    expect(control).not.toBeChecked()
    await userEvent.click(control)
    expect(control).toBeChecked()
  })

  it('reports changes to the caller', async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('does not toggle when disabled', async () => {
    render(<Switch aria-label="Notifications" disabled />)
    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).not.toBeChecked()
  })
})
