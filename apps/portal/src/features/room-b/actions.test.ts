import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolvePortalIdentity } from '../../auth/identity'
import {
  getRoomBCalendarAction,
  getRoomBScheduleAction,
  getPublicRoomBScheduleAction,
  getRoomBBookingContextAction,
  createRoomBBookingAction,
  cancelRoomBBookingAction,
  overwriteRoomBBookingAction,
} from './actions'
import {
  createRoomBBooking,
  cancelRoomBBooking,
  overwriteRoomBBooking,
  getRoomBBookingContext,
} from './bookings'
import { getRoomBSchedule } from './schedule'
import { getRoomBCalendar } from './calendar'
import type { PortalIdentity } from '../../auth/access'

vi.mock('@tanstack/react-start', () => ({
  createServerOnlyFn: (fn: unknown) => fn,
  createServerFn: () => ({
    validator: () => ({
      handler: (handler: (input: { data: unknown }) => unknown) => handler,
    }),
  }),
}))
vi.mock('../../auth/identity', () => ({ resolvePortalIdentity: vi.fn() }))
vi.mock('./calendar', () => ({ getRoomBCalendar: vi.fn() }))
vi.mock('./schedule', () => ({ getRoomBSchedule: vi.fn() }))
vi.mock('./bookings', () => ({
  getRoomBBookingContext: vi.fn(),
  createRoomBBooking: vi.fn(),
  cancelRoomBBooking: vi.fn(),
  overwriteRoomBBooking: vi.fn(),
}))

beforeEach(() => vi.resetAllMocks())

describe('Room B calendar access', () => {
  it('allows anonymous public schedule reads without resolving identity or booking context', async () => {
    vi.mocked(resolvePortalIdentity).mockRejectedValue(new Error('No session'))
    const calendar = {
      date: '2030-01-07',
      week: '2030-01-07',
      currentWeek: '2030-01-07',
      nextBookableWeek: '2030-01-14',
      days: [],
    }
    vi.mocked(getRoomBSchedule).mockResolvedValue(calendar)
    await expect(
      getPublicRoomBScheduleAction({
        data: { date: calendar.date, view: 'month' },
      }),
    ).resolves.toEqual(calendar)
    expect(resolvePortalIdentity).not.toHaveBeenCalled()
    expect(getRoomBBookingContext).not.toHaveBeenCalled()
    expect(getRoomBSchedule).toHaveBeenCalledWith({
      date: calendar.date,
      view: 'month',
    })
  })

  it.each(['anonymous', 'denied'] as const)(
    'keeps booking context and mutations protected for %s viewers',
    async (kind) => {
      vi.mocked(resolvePortalIdentity).mockResolvedValue({ kind })
      const bookingId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      const owner = { kind: 'club' as const, clubId: bookingId }
      await expect(getRoomBBookingContextAction({ data: {} })).rejects.toThrow(
        'Sign in',
      )
      await expect(
        createRoomBBookingAction({
          data: { date: '2030-01-07', startHour: 8, endHour: 9, owner },
        }),
      ).rejects.toThrow('Sign in')
      await expect(
        cancelRoomBBookingAction({ data: { bookingId } }),
      ).rejects.toThrow('Sign in')
      await expect(
        overwriteRoomBBookingAction({
          data: { bookingId, owner, confirmed: true },
        }),
      ).rejects.toThrow('Sign in')
      for (const operation of [
        getRoomBBookingContext,
        createRoomBBooking,
        cancelRoomBBooking,
        overwriteRoomBBooking,
      ])
        expect(operation).not.toHaveBeenCalled()
    },
  )

  it.each(['anonymous', 'denied'] as const)(
    'rejects %s requests before reading reservations',
    async (kind) => {
      vi.mocked(resolvePortalIdentity).mockResolvedValue({ kind })

      await expect(getRoomBCalendarAction({ data: {} })).rejects.toThrow(
        'Sign in',
      )
      expect(getRoomBCalendar).not.toHaveBeenCalled()
      await expect(
        getRoomBScheduleAction({ data: { view: 'month' } }),
      ).rejects.toThrow()
      expect(getRoomBSchedule).not.toHaveBeenCalled()
    },
  )

  it.each(['member', 'administrator', 'superuser'] as const)(
    'allows an authenticated %s to view the calendar',
    async (kind) => {
      const identity: PortalIdentity = { kind, email: 'viewer@example.com' }
      vi.mocked(resolvePortalIdentity).mockResolvedValue(identity)
      const calendar = {
        week: '2030-01-07',
        currentWeek: '2030-01-07',
        nextBookableWeek: '2030-01-14',
        days: [],
      }
      vi.mocked(getRoomBCalendar).mockResolvedValue(calendar)

      await expect(
        getRoomBCalendarAction({ data: { week: calendar.week } }),
      ).resolves.toEqual(calendar)
      expect(getRoomBCalendar).toHaveBeenCalledWith({ week: calendar.week })
      const schedule = { ...calendar, date: calendar.week }
      vi.mocked(getRoomBSchedule).mockResolvedValue(schedule)
      await expect(
        getRoomBScheduleAction({
          data: { date: calendar.week, view: 'month' },
        }),
      ).resolves.toEqual(schedule)
      expect(getRoomBSchedule).toHaveBeenCalledWith({
        date: calendar.week,
        view: 'month',
      })
    },
  )

  it('does not read reservations if session verification fails', async () => {
    vi.mocked(resolvePortalIdentity).mockRejectedValue(new Error('Unavailable'))

    await expect(getRoomBCalendarAction({ data: {} })).rejects.toThrow(
      'Unavailable',
    )
    expect(getRoomBCalendar).not.toHaveBeenCalled()
    await expect(
      getRoomBScheduleAction({ data: { view: 'month' } }),
    ).rejects.toThrow()
    expect(getRoomBSchedule).not.toHaveBeenCalled()
  })
})
