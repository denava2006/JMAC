import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from '@/components/ui/calendar'
import { CHART_SERIES, chartSeriesColor } from '@/components/ui/chart'
import { DatePicker } from '@/components/ui/date-picker'

describe('Calendar', () => {
  it('renders a grid for the month it is shown', () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 7, 1)} />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByText('August 2026')).toBeInTheDocument()
  })

  it('reports the picked day', async () => {
    const onSelect = vi.fn()
    render(
      <Calendar mode="single" defaultMonth={new Date(2026, 7, 1)} onSelect={onSelect} />
    )
    await userEvent.click(screen.getByRole('button', { name: /15/ }))
    expect(onSelect).toHaveBeenCalled()
  })

  it('offers month navigation', async () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 7, 1)} />)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('September 2026')).toBeInTheDocument()
  })
})

describe('DatePicker', () => {
  it('shows the placeholder when it has no value', () => {
    render(<DatePicker placeholder="Date of birth" />)
    expect(screen.getByRole('button', { name: /Date of birth/ })).toBeInTheDocument()
  })

  // Spelled-out month by default: 03/04/2026 is a different date depending on
  // where the reader is from.
  it('formats an existing value unambiguously', () => {
    render(<DatePicker value={new Date(2026, 7, 15)} />)
    expect(screen.getByRole('button', { name: /15 August 2026/ })).toBeInTheDocument()
  })

  it('opens a calendar and reports the picked date', async () => {
    const onChange = vi.fn()
    render(<DatePicker value={new Date(2026, 7, 1)} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(await screen.findByRole('button', { name: /15/ }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0]?.[0]).toBeInstanceOf(Date)
  })

  it('closes once a date is picked', async () => {
    render(<DatePicker value={new Date(2026, 7, 1)} onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button'))
    expect(await screen.findByRole('grid')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /15/ }))
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })

  it('reports invalid state to assistive technology, like Input does', () => {
    render(<DatePicker invalid />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not open when disabled', async () => {
    render(<DatePicker disabled />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })
})

describe('chart palette', () => {
  it('reads every series colour from a token, never a literal', () => {
    for (const colour of CHART_SERIES) {
      expect(colour).toMatch(/^var\(--color-/)
    }
  })

  it('cycles rather than running out on a chart with many series', () => {
    expect(chartSeriesColor(0)).toBe(CHART_SERIES[0])
    expect(chartSeriesColor(CHART_SERIES.length)).toBe(CHART_SERIES[0])
    expect(chartSeriesColor(CHART_SERIES.length + 2)).toBe(CHART_SERIES[2])
  })
})
