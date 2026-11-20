import { describe, expect, it } from 'vitest'

import {
  requireRoomBBookingWindow,
  roomBBookingInput,
  roomBOverwriteInput,
  roomBHourStart,
  roomBWeek,
} from './policy.js'

const now = new Date('2030-01-07T12:00:00Z')
const input = {
  date: '2030-01-07',
  startHour: 8,
  endHour: 10,
  owner: { kind: 'club', clubId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
}

describe('Room B policy', () => {
  it('requires an explicit confirmation and valid owner for an overwrite', () => {
    const overwrite = {
      bookingId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      owner: input.owner,
      confirmed: true,
    }
    expect(roomBOverwriteInput.safeParse(overwrite).success).toBe(true)
    expect(
      roomBOverwriteInput.safeParse({ ...overwrite, confirmed: false }).success,
    ).toBe(false)
    expect(
      roomBOverwriteInput.safeParse({ ...overwrite, confirmed: undefined })
        .success,
    ).toBe(false)
    expect(
      roomBOverwriteInput.safeParse({ ...overwrite, bookingId: 'invalid' })
        .success,
    ).toBe(false)
  })
  it('accepts whole-hour reservations between 08:00 and 22:00', () => {
    expect(roomBBookingInput.safeParse(input).success).toBe(true)
    expect(
      roomBBookingInput.safeParse({ ...input, startHour: 21, endHour: 22 })
        .success,
    ).toBe(true)
  })

  it.each([
    { startHour: 7 },
    { endHour: 23 },
    { startHour: 8.5 },
    { endHour: 9.5 },
    { endHour: 8 },
    { date: '2030-02-30' },
    { date: '2030-01-07T08:00:00Z' },
    { owner: { kind: 'boardMember', memberId: 'invalid' } },
  ])('rejects invalid booking input: %j', (override) => {
    expect(roomBBookingInput.safeParse({ ...input, ...override }).success).toBe(
      false,
    )
  })

  it('allows weekdays in only the current and next Toronto weeks', () => {
    expect(requireRoomBBookingWindow('2030-01-11', 8, now)).toBe('2030-01-07')
    expect(requireRoomBBookingWindow('2030-01-18', 21, now)).toBe('2030-01-14')
    expect(() => requireRoomBBookingWindow('2030-01-12', 8, now)).toThrow(
      'weekdays only',
    )
    expect(() => requireRoomBBookingWindow('2030-01-20', 21, now)).toThrow(
      'weekdays only',
    )
    expect(() => requireRoomBBookingWindow('2030-01-21', 8, now)).toThrow(
      'current or next',
    )
    expect(() => requireRoomBBookingWindow('2030-01-06', 8, now)).toThrow(
      'current or next',
    )
    expect(() =>
      requireRoomBBookingWindow(
        '2030-01-07',
        8,
        new Date('2030-01-07T13:00:00Z'),
      ),
    ).toThrow('already started')
  })

  it('uses Toronto dates and DST instead of UTC days or fixed offsets', () => {
    expect(roomBWeek(undefined, new Date('2030-01-07T02:00:00Z'))).toBe(
      '2030-01-07',
    )
    expect(roomBHourStart('2030-01-07', 8).toISOString()).toBe(
      '2030-01-07T13:00:00.000Z',
    )
    expect(roomBHourStart('2030-07-08', 8).toISOString()).toBe(
      '2030-07-08T12:00:00.000Z',
    )
    expect(() => roomBWeek('invalid')).toThrow('valid date')
  })

  it.each([
    ['2026-11-13T17:00:00Z', '2026-11-09'], // Friday
    ['2026-11-14T04:59:59Z', '2026-11-09'], // Still Friday in Toronto
    ['2026-11-14T05:00:00Z', '2026-11-16'], // Saturday midnight
    ['2026-11-15T17:00:00Z', '2026-11-16'], // Sunday
    ['2026-11-16T04:59:59Z', '2026-11-16'], // Still Sunday in Toronto
    ['2026-11-16T05:00:00Z', '2026-11-16'], // Monday midnight
    ['2026-03-08T06:59:00Z', '2026-03-09'], // Before DST starts
    ['2026-03-08T07:01:00Z', '2026-03-09'], // After DST starts
    ['2026-11-01T05:30:00Z', '2026-11-02'], // Before DST ends
    ['2026-11-01T06:30:00Z', '2026-11-02'], // After DST ends
    ['2028-01-01T17:00:00Z', '2028-01-03'], // Year boundary
  ])('defaults to the relevant weekday calendar at %s', (timestamp, week) => {
    expect(roomBWeek(undefined, new Date(timestamp))).toBe(week)
  })

  it('preserves explicitly selected weeks on weekends', () => {
    const sunday = new Date('2026-11-15T17:00:00Z')
    expect(roomBWeek('2026-11-09', sunday)).toBe('2026-11-09')
    expect(roomBWeek('2026-11-15', sunday)).toBe('2026-11-09')
    expect(roomBWeek('2026-11-16', sunday)).toBe('2026-11-16')
    // Booking windows and quota boundaries still use the actual current week.
    expect(requireRoomBBookingWindow('2026-11-16', 8, sunday)).toBe(
      '2026-11-16',
    )
    expect(() => requireRoomBBookingWindow('2026-11-23', 8, sunday)).toThrow(
      'current or next',
    )
  })
})
