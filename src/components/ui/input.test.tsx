import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('accepts typed text', async () => {
    render(<Input aria-label="Full name" />)
    await userEvent.type(screen.getByLabelText('Full name'), 'Maria Santos')
    expect(screen.getByLabelText('Full name')).toHaveValue('Maria Santos')
  })

  it('reports invalid state to assistive technology, not only visually', () => {
    render(<Input aria-label="Email" invalid />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveClass('border-error')
  })

  it('is not aria-invalid when valid', () => {
    render(<Input aria-label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('cannot be typed into when disabled', async () => {
    render(<Input aria-label="Email" disabled />)
    await userEvent.type(screen.getByLabelText('Email'), 'x')
    expect(screen.getByLabelText('Email')).toHaveValue('')
  })

  it('exposes its DOM node through ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} aria-label="Email" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('lets a caller className override a default class', () => {
    render(<Input aria-label="Email" className="rounded-xl" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveClass('rounded-xl')
    expect(input).not.toHaveClass('rounded-md')
  })
})
