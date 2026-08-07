import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Radix Select drives its popper with pointer-capture and scroll APIs that
// jsdom does not implement. Without these stubs the component throws on open.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

function Fixture({ onValueChange }: { onValueChange?: (value: string) => void }) {
  return (
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Department">
        <SelectValue placeholder="Select a department" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="hr">Human Resources</SelectItem>
        <SelectItem value="retail">Retail Operations</SelectItem>
      </SelectContent>
    </Select>
  )
}

describe('Select', () => {
  it('shows the placeholder before anything is chosen', () => {
    render(<Fixture />)
    expect(screen.getByText('Select a department')).toBeInTheDocument()
  })

  it('opens on click and lists its options', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Department' }))
    expect(await screen.findByRole('option', { name: 'Human Resources' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Retail Operations' })).toBeInTheDocument()
  })

  it('reports the chosen value and shows it on the trigger', async () => {
    const onValueChange = vi.fn()
    render(<Fixture onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Retail Operations' }))
    expect(onValueChange).toHaveBeenCalledWith('retail')
    expect(screen.getByRole('combobox')).toHaveTextContent('Retail Operations')
  })

  it('opens from the keyboard', async () => {
    render(<Fixture />)
    await userEvent.tab()
    expect(screen.getByRole('combobox')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('option', { name: 'Human Resources' })).toBeInTheDocument()
  })
})
