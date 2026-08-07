import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from '@/components/ui/error-state'

describe('ErrorState', () => {
  it('announces itself as an alert', () => {
    render(<ErrorState title="Could not load employees" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders a retry action when one is given', async () => {
    const onRetry = vi.fn()
    render(<ErrorState title="Could not load" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders no retry button when no handler is given', () => {
    render(<ErrorState title="Could not load" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
