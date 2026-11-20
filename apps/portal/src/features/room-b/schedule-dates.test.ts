import { describe, expect, it } from 'vitest'
import {
  defaultScheduleDate,
  moveScheduleDate,
  scheduleDates,
  torontoDate,
} from './schedule-dates'

describe('schedule dates', () => {
  it('uses Toronto dates and opens the upcoming week on weekends', () => {
    expect(torontoDate(new Date('2026-11-21T04:59:00Z'))).toBe('2026-11-20')
    expect(defaultScheduleDate(new Date('2026-11-21T04:59:00Z'))).toBe(
      '2026-11-20',
    )
    expect(defaultScheduleDate(new Date('2026-11-21T05:00:00Z'))).toBe(
      '2026-11-23',
    )
    expect(defaultScheduleDate(new Date('2026-11-23T04:59:00Z'))).toBe(
      '2026-11-23',
    )
  })
  it('builds day, weekday, and complete month grids', () => {
    expect(scheduleDates('2026-11-22', 'day')).toEqual(['2026-11-22'])
    expect(scheduleDates('2026-11-20', 'week')).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
    ])
    const november = scheduleDates('2026-11-20', 'month')
    expect(november).toHaveLength(42)
    expect(november[0]).toBe('2026-10-26')
    expect(november.at(-1)).toBe('2026-12-06')
    expect(scheduleDates('2028-02-01', 'month')).toContain('2028-02-29')
  })
  it('navigates months without skipping short months, including leap years', () => {
    expect(moveScheduleDate('2026-01-31', 'month', 1)).toBe('2026-02-28')
    expect(moveScheduleDate('2028-01-31', 'month', 1)).toBe('2028-02-29')
    expect(moveScheduleDate('2026-01-01', 'month', -1)).toBe('2025-12-01')
    expect(moveScheduleDate('2026-12-31', 'day', 1)).toBe('2027-01-01')
    expect(moveScheduleDate('2026-12-31', 'week', 1)).toBe('2027-01-07')
  })
})
