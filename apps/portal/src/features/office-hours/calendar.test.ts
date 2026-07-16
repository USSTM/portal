import { describe, expect, it } from 'vitest'

import { addDays, currentTorontoMonday, mondayForDate } from './calendar'

describe('Office Hours week calculations', () => {
  it('normalizes any valid calendar date to Monday', () => {
    expect(mondayForDate('2026-07-08')).toBe('2026-07-06')
    expect(mondayForDate('2026-07-05')).toBe('2026-06-29')
    expect(mondayForDate('2026-02-30')).toBeUndefined()
  })

  it('uses Toronto calendar dates across daylight-saving boundaries', () => {
    expect(currentTorontoMonday(new Date('2026-03-08T06:59:00Z'))).toBe(
      '2026-03-02',
    )
    expect(currentTorontoMonday(new Date('2026-03-08T07:01:00Z'))).toBe(
      '2026-03-02',
    )
    expect(currentTorontoMonday(new Date('2026-07-06T03:30:00Z'))).toBe(
      '2026-06-29',
    )
    expect(currentTorontoMonday(new Date('2026-07-06T04:30:00Z'))).toBe(
      '2026-07-06',
    )
  })

  it('navigates weeks without timezone shifts', () => {
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04')
    expect(addDays('2026-03-09', -7)).toBe('2026-03-02')
  })
})
