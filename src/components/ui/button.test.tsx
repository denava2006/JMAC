import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save changes</Button>)
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('applies the primary variant by default', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })

  it('applies a requested variant instead of the default', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-error')
    expect(button).not.toHaveClass('bg-primary')
  })

  it('lets a caller className override a variant class', () => {
    render(<Button className="bg-success">Approve</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-success')
    expect(button).not.toHaveClass('bg-primary')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Go</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders as the child element when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/careers">Careers</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Careers' })
    expect(link).toHaveAttribute('href', '/careers')
    expect(link).toHaveClass('bg-primary')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('exposes its DOM node through ref', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Save</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('is reachable and activatable by keyboard', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })
})
