import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  it('associates with its control so clicking focuses it', async () => {
    render(
      <>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" />
      </>
    )
    await userEvent.click(screen.getByText('Email address'))
    expect(screen.getByLabelText('Email address')).toHaveFocus()
  })

  it('marks required fields for screen readers as well as sighted users', () => {
    render(<Label required>Email</Label>)
    const marker = screen.getByText('*')
    expect(marker).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('(required)')).toHaveClass('sr-only')
  })
})
