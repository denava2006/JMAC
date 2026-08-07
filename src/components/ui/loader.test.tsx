import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Loader } from '@/components/ui/loader'

describe('Loader', () => {
  it('announces itself to assistive technology', () => {
    render(<Loader />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading')).toHaveClass('sr-only')
  })

  it('accepts a specific label so a page can say what is loading', () => {
    render(<Loader label="Loading employees" />)
    expect(screen.getByText('Loading employees')).toBeInTheDocument()
  })

  it('applies a requested size', () => {
    render(<Loader size="lg" />)
    expect(screen.getByRole('status').firstElementChild).toHaveClass('size-8')
  })
})
