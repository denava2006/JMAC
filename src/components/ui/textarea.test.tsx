import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('accepts typed text', async () => {
    render(<Textarea aria-label="Notes" />)
    await userEvent.type(screen.getByLabelText('Notes'), 'Interview went well')
    expect(screen.getByLabelText('Notes')).toHaveValue('Interview went well')
  })

  it('reports invalid state to assistive technology', () => {
    render(<Textarea aria-label="Notes" invalid />)
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-invalid', 'true')
  })

  it('exposes its DOM node through ref', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} aria-label="Notes" />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })
})
