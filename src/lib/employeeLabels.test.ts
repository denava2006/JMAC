import { describe, expect, it } from 'vitest'
import {
  employmentStatusLabel,
  employmentStatusVariant,
  employmentTypeLabel,
} from '@/lib/employeeLabels'

describe('employmentStatusLabel', () => {
  it('labels every enum value', () => {
    expect(employmentStatusLabel('active')).toBe('Active')
    expect(employmentStatusLabel('on_leave')).toBe('On leave')
    expect(employmentStatusLabel('terminated')).toBe('Terminated')
  })

  it('falls back to the raw value for anything unexpected', () => {
    expect(employmentStatusLabel('probation')).toBe('probation')
  })
})

describe('employmentStatusVariant', () => {
  it('maps active to success and terminated to error', () => {
    expect(employmentStatusVariant('active')).toBe('success')
    expect(employmentStatusVariant('terminated')).toBe('error')
  })

  it('is neutral for an unknown status rather than undefined', () => {
    expect(employmentStatusVariant('mystery')).toBe('neutral')
  })
})

describe('employmentTypeLabel', () => {
  // employees.employment_type is free text holding full_time / part_time, NOT
  // the job_postings enum (regular, part_time). Labelling the wrong set
  // printed a raw "full_time" in the table.
  it('labels the values the employees table actually stores', () => {
    expect(employmentTypeLabel('full_time')).toBe('Full time')
    expect(employmentTypeLabel('part_time')).toBe('Part time')
  })

  it('shows a dash for a missing type', () => {
    expect(employmentTypeLabel(null)).toBe('—')
  })

  // Free text can hold anything; an unmapped value should read as words, not a
  // snake_case token.
  it('humanises an unmapped value rather than printing it raw', () => {
    expect(employmentTypeLabel('fixed_term')).toBe('fixed term')
  })
})
