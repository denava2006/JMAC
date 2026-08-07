import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function Fixture() {
  return (
    <Popover>
      <PopoverTrigger>Filters</PopoverTrigger>
      <PopoverContent>
        <p>Filter by department</p>
      </PopoverContent>
    </Popover>
  )
}

describe('Popover', () => {
  it('renders nothing until opened', () => {
    render(<Fixture />)
    expect(screen.queryByText('Filter by department')).not.toBeInTheDocument()
  })

  it('opens on trigger click', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Filters'))
    expect(await screen.findByText('Filter by department')).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Filters'))
    expect(await screen.findByText('Filter by department')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByText('Filter by department')).not.toBeInTheDocument()
  })

  it('sits above the modal layer, so a picker inside a dialog is not hidden', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Filters'))
    expect(await screen.findByText('Filter by department')).toBeInTheDocument()
    expect(screen.getByText('Filter by department').parentElement).toHaveClass('z-popover')
  })
})
