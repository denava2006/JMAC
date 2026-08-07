import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Open</Badge>)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('applies the neutral variant by default', () => {
    render(<Badge>Draft</Badge>)
    expect(screen.getByText('Draft')).toHaveClass('bg-muted')
  })

  it('applies a requested variant instead of the default', () => {
    render(<Badge variant="success">Approved</Badge>)
    const badge = screen.getByText('Approved')
    expect(badge).toHaveClass('bg-success')
    expect(badge).not.toHaveClass('bg-muted')
  })

  it('lets a caller className override a variant class', () => {
    render(<Badge className="bg-accent">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('bg-accent')
    expect(badge).not.toHaveClass('bg-muted')
  })
})
