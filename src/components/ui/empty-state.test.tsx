import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from '@/components/ui/empty-state'

describe('EmptyState', () => {
  it('renders its title and description', () => {
    render(<EmptyState title="No open positions" description="Check back soon." />)
    expect(screen.getByText('No open positions')).toBeInTheDocument()
    expect(screen.getByText('Check back soon.')).toBeInTheDocument()
  })

  it('renders an action when one is given', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="No employees"
        action={{ label: 'Add employee', onClick }}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders no button when no action is given', () => {
    render(<EmptyState title="No employees" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
