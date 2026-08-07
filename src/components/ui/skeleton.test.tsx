import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  it('is hidden from assistive technology, which should hear the loader instead', () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses the muted surface so it reads as distinct from the page', () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('bg-muted')
  })

  it('lets a caller set its shape', () => {
    render(<Skeleton className="h-4 w-32" data-testid="skeleton" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('h-4', 'w-32')
  })
})
