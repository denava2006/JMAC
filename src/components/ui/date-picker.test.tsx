import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from '@/components/ui/calendar'
import { CHART_SERIES, chartSeriesColor } from '@/components/ui/chart'
import { DatePicker, dayMatchers } from '@/components/ui/date-picker'

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

  // The actual fix in the browser: a past day must not be selectable when a
  // minDate is set. Renders August 2026 with minDate on the 15th and checks
  // the 10th is disabled while the 15th and 20th are not.
  it('disables days before minDate but keeps minDate itself selectable', async () => {
    render(
      <DatePicker
        value={new Date(2026, 7, 20)}
        minDate={new Date(2026, 7, 15)}
        onChange={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button'))
    const grid = await screen.findByRole('grid')
    // Day buttons carry a weekday-prefixed accessible name, so match on the
    // visible day number instead.
    const day = (n: string) => {
      const button = within(grid)
        .getAllByRole('button')
        .find((candidate) => candidate.textContent?.trim() === n)
      if (!button) throw new Error(`Day ${n} not found in the calendar grid`)
      return button
    }
    expect(day('10')).toBeDisabled()
    expect(day('15')).toBeEnabled()
    expect(day('20')).toBeEnabled()
  })
})

describe('dayMatchers', () => {
  it('returns nothing when neither bound is set', () => {
    expect(dayMatchers()).toBeUndefined()
  })

  // The boundary must stay selectable. react-day-picker's `before` matcher is
  // exclusive, so a minDate of the 15th disables everything strictly before
  // the 15th — leaving the 15th pickable. An off-by-one here would forbid
  // filing leave that starts today, or publishing a posting that closes today.
  it('disables days strictly before minDate, normalised to local midnight', () => {
    const matchers = dayMatchers(new Date(2026, 7, 15, 9, 30))
    expect(matchers).toHaveLength(1)
    const before = (matchers as Array<{ before: Date }>)[0]!.before
    expect(before.getFullYear()).toBe(2026)
    expect(before.getMonth()).toBe(7)
    expect(before.getDate()).toBe(15)
    expect(before.getHours()).toBe(0)
  })

  it('disables days after maxDate', () => {
    const matchers = dayMatchers(undefined, new Date(2026, 11, 31, 23, 59))
    const after = (matchers as Array<{ after: Date }>)[0]!.after
    expect(after.getDate()).toBe(31)
    expect(after.getHours()).toBe(0)
  })

  it('returns both bounds for a windowed picker', () => {
    expect(dayMatchers(new Date(2026, 0, 1), new Date(2026, 11, 31))).toHaveLength(2)
  })

  it('does not mutate the dates it is given', () => {
    const min = new Date(2026, 7, 15, 9, 30)
    dayMatchers(min)
    expect(min.getHours()).toBe(9)
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
