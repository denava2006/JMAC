import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'
import { Toaster, toast } from '@/components/ui/toast'

function Fixture() {
  return (
    <>
      <Button onClick={() => toast('Employee saved')}>Save</Button>
      <Toaster />
    </>
  )
}

describe('Toaster', () => {
  it('renders no toast until one is raised', () => {
    render(<Fixture />)
    expect(screen.queryByText('Employee saved')).not.toBeInTheDocument()
  })

  it('shows a toast raised from anywhere in the tree', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Employee saved')).toBeInTheDocument()
  })

  it('mounts a live region so a raised toast is announced, not just drawn', () => {
    render(<Fixture />)
    expect(document.querySelector('[aria-live]')).not.toBeNull()
  })
})
