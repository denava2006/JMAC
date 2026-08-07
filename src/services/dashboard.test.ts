import { describe, expect, it } from 'vitest'
import { LOW_STOCK_THRESHOLD, todayIso } from '@/services/dashboard'

describe('todayIso', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(todayIso(new Date(2026, 7, 15))).toBe('2026-08-15')
  })

  it('zero-pads single-digit months and days', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  /**
   * The reason this function exists rather than a call to toISOString().
   *
   * The Philippines is UTC+8, so 2026-08-15 21:00 local is 13:00 UTC — same
   * day. But 2026-08-15 07:00 local is 2026-08-14 23:00 UTC, and toISOString()
   * would report the 14th. "Present today" would then count yesterday's
   * attendance for every morning shift.
   */
  it('reports the local date, not the UTC one', () => {
    // A local morning that is the previous day in UTC for a UTC+8 offset.
    const localMorning = new Date(2026, 7, 15, 7, 0, 0)
    expect(todayIso(localMorning)).toBe('2026-08-15')
  })

  it('reports the local date late in the evening too', () => {
    const localEvening = new Date(2026, 7, 15, 23, 30, 0)
    expect(todayIso(localEvening)).toBe('2026-08-15')
  })

  it('handles the last day of a year', () => {
    expect(todayIso(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('LOW_STOCK_THRESHOLD', () => {
  it('is defined once so tiles and future reports agree on "low"', () => {
    expect(LOW_STOCK_THRESHOLD).toBe(10)
  })
})
