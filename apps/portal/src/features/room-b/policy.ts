import { z } from 'zod'

import {
  addDays,
  currentTorontoMonday,
  mondayForDate,
} from '../office-hours/calendar.js'
import { torontoLocalDateTime } from '../office-hours/time.js'

export const roomBOwnerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('club'), clubId: z.uuid() }),
  z.object({ kind: z.literal('boardMember'), memberId: z.uuid() }),
])

export type RoomBOwner = z.infer<typeof roomBOwnerSchema>

export const roomBDateSchema = z
  .string()
  .refine((date) => mondayForDate(date) !== undefined, 'Invalid calendar date')

export const roomBBookingInput = z
  .object({
    date: roomBDateSchema,
    startHour: z.number().int().min(8).max(21),
    endHour: z.number().int().min(9).max(22),
    owner: roomBOwnerSchema,
  })
  .refine((input) => input.endHour > input.startHour, {
    message: 'End hour must be later than start hour',
    path: ['endHour'],
  })

export type RoomBBookingInput = z.infer<typeof roomBBookingInput>

export const roomBOverwriteInput = z.object({
  bookingId: z.uuid(),
  owner: roomBOwnerSchema,
  confirmed: z.literal(true),
})

export type RoomBOverwriteInput = z.infer<typeof roomBOverwriteInput>

export function roomBHourStart(date: string, hour: number) {
  const start = torontoLocalDateTime(
    `${date}T${String(hour).padStart(2, '0')}:00`,
  )
  if (!start) throw new Error('Invalid EPH 442B date or hour')
  return start
}

export function requireRoomBBookingWindow(
  date: string,
  startHour: number,
  now: Date,
) {
  const week = mondayForDate(date)
  const currentWeek = currentTorontoMonday(now)
  if (!week || (week !== currentWeek && week !== addDays(currentWeek, 7))) {
    throw new Error(
      'EPH 442B bookings are limited to the current or next Toronto week',
    )
  }
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  if (weekday === 0 || weekday === 6) {
    throw new Error('EPH 442B bookings are weekdays only')
  }
  if (roomBHourStart(date, startHour) <= now) {
    throw new Error('This EPH 442B booking has already started')
  }
  return week
}

export function roomBWeek(week?: string, now = new Date()) {
  if (week !== undefined) {
    const value = mondayForDate(week)
    if (!value) throw new Error('week must be a valid date')
    return value
  }
  const currentWeek = currentTorontoMonday(now)
  const weekday = torontoWeekdayFormatter.format(now)
  return weekday === 'Sat' || weekday === 'Sun'
    ? addDays(currentWeek, 7)
    : currentWeek
}

const torontoWeekdayFormatter = new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  timeZone: 'America/Toronto',
})
