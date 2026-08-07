import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Radix menus use the same pointer APIs jsdom does not implement as Select.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

function Fixture({ onSelect }: { onSelect?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Account</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Signed in as Maria</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSelect}>Profile</DropdownMenuItem>
        <DropdownMenuItem disabled>Billing</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe('DropdownMenu', () => {
  it('renders no menu until opened', () => {
    render(<Fixture />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens on click and lists its items', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Account'))
    expect(await screen.findByRole('menuitem', { name: 'Profile' })).toBeInTheDocument()
  })

  it('reports the selected item', async () => {
    const onSelect = vi.fn()
    render(<Fixture onSelect={onSelect} />)
    await userEvent.click(screen.getByText('Account'))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Profile' }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('marks a disabled item as disabled for assistive technology', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Account'))
    expect(await screen.findByRole('menuitem', { name: 'Billing' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('closes on Escape', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Account'))
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
