import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function Fixture() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete employee</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button">Confirm</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog', () => {
  it('renders nothing until opened', () => {
    render(<Fixture />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on trigger click and names itself from its title', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Open'))
    expect(await screen.findByRole('dialog', { name: 'Delete employee' })).toBeInTheDocument()
  })

  it('describes itself from its description, so a screen reader hears the stakes', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Open'))
    expect(await screen.findByRole('dialog')).toHaveAccessibleDescription(
      'This cannot be undone.'
    )
  })

  it('closes on Escape', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Open'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('offers a labelled close control', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Open'))
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
