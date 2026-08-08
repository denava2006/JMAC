import { describe, expect, it } from 'vitest'
import { inclusiveDays, leaveStatusLabel, leaveStatusVariant } from '@/lib/leaveLabels'

describe('leaveStatusLabel', () => {
  it('labels each status', () => {
    expect(leaveStatusLabel('pending')).toBe('Pending')
    expect(leaveStatusLabel('approved')).toBe('Approved')
    expect(leaveStatusLabel('rejected')).toBe('Rejected')
    expect(leaveStatusLabel('cancelled')).toBe('Cancelled')
  })

  it('falls back to the raw value', () => {
    expect(leaveStatusLabel('withdrawn')).toBe('withdrawn')
  })
})

describe('leaveStatusVariant', () => {
  it('maps pending to warning and rejected to error', () => {
    expect(leaveStatusVariant('pending')).toBe('warning')
    expect(leaveStatusVariant('rejected')).toBe('error')
  })

  it('is neutral for an unknown status', () => {
    expect(leaveStatusVariant('paused')).toBe('neutral')
  })
})

describe('inclusiveDays', () => {
  // A single-day leave is one day, not zero — the reason this is not a bare
  // date subtraction. The browser showed 15→17 as 3 days; this pins it.
  it('counts a one-day leave as one day', () => {
    expect(inclusiveDays('2026-08-15', '2026-08-15')).toBe(1)
  })

  it('counts an inclusive range', () => {
    expect(inclusiveDays('2026-08-15', '2026-08-17')).toBe(3)
  })

  it('spans a month boundary correctly', () => {
    // Aug 30, 31, Sep 1 = 3 days.
    expect(inclusiveDays('2026-08-30', '2026-09-01')).toBe(3)
  })

  it('is 0 when the end is before the start, rather than negative', () => {
    expect(inclusiveDays('2026-08-17', '2026-08-15')).toBe(0)
  })

  it('is unaffected by daylight-saving shifts, since the Philippines has none', () => {
    // A long span still counts calendar days, not 23/25-hour days.
    expect(inclusiveDays('2026-01-01', '2026-12-31')).toBe(365)
  })
})
