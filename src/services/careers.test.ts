import { describe, expect, it } from 'vitest'
import {
  EMPLOYMENT_TYPE_LABEL,
  isAcceptingApplications,
  isPastClosingDate,
} from '@/services/careers'

function isoDaysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

describe('isPastClosingDate', () => {
  it('is false for a posting with no closing date', () => {
    expect(isPastClosingDate(null)).toBe(false)
  })

  it('is false for a date in the future', () => {
    expect(isPastClosingDate(isoDaysFromNow(30))).toBe(false)
  })

  it('is true for a date in the past', () => {
    expect(isPastClosingDate(isoDaysFromNow(-1))).toBe(true)
  })

  // Closing "today" means applications are still open today. Off-by-one here
  // would shut the form a day early for every applicant on the deadline.
  it('is false on the closing date itself', () => {
    expect(isPastClosingDate(isoDaysFromNow(0))).toBe(false)
  })
})

describe('isAcceptingApplications', () => {
  it('accepts while the closing date has not passed', () => {
    expect(isAcceptingApplications({ closingDate: isoDaysFromNow(7) })).toBe(true)
    expect(isAcceptingApplications({ closingDate: null })).toBe(true)
  })

  it('stops once it has', () => {
    expect(isAcceptingApplications({ closingDate: isoDaysFromNow(-7) })).toBe(false)
  })
})

describe('EMPLOYMENT_TYPE_LABEL', () => {
  it('covers every value of the employment_type enum', () => {
    // The enum is full_time, part_time, contract, internship. A missing label
    // renders a raw database value like "part_time" on the careers page.
    expect(Object.keys(EMPLOYMENT_TYPE_LABEL).sort()).toEqual([
      'contract',
      'full_time',
      'internship',
      'part_time',
    ])
  })
})
