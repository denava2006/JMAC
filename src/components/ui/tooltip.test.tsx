import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function Fixture() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>Export</TooltipTrigger>
        <TooltipContent>Download as Excel</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

describe('Tooltip', () => {
  it('renders nothing until the trigger is focused or hovered', () => {
    render(<Fixture />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  // Keyboard focus, not hover: a tooltip only reachable by pointer is
  // invisible to keyboard and screen-reader users.
  it('opens on keyboard focus', async () => {
    render(<Fixture />)
    await userEvent.tab()
    expect(screen.getByText('Export')).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Download as Excel')
  })

  it('describes its trigger, so the label is announced with the control', async () => {
    render(<Fixture />)
    await userEvent.tab()
    await screen.findByRole('tooltip')
    expect(screen.getByText('Export')).toHaveAccessibleDescription('Download as Excel')
  })
})
