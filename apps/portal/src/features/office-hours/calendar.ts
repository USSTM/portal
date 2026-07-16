import { and, asc, gte, lte } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import { bookings, shiftSlots } from '../../db/schema.js'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export function mondayForDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined
  }
  const weekday = date.getUTCDay()
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1
  date.setUTCDate(date.getUTCDate() - daysSinceMonday)
  return asDateString(date)
}

export function currentTorontoMonday(now = new Date()) {
  const parts = Object.fromEntries(
    torontoDateFormatter
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return mondayForDate(`${parts.year}-${parts.month}-${parts.day}`)!
}

export function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  parsed.setUTCDate(parsed.getUTCDate() + days)
  return asDateString(parsed)
}

export async function getOfficeHoursCalendar(
  input: {
    now?: Date
    viewerMemberId?: string
    viewerCanOverride?: boolean
    week?: string
  } = {},
) {
  const currentWeek = currentTorontoMonday(input.now)
  const week = input.week ? mondayForDate(input.week) : currentWeek
  if (!week) throw new Error('week must be a valid date')
  const dates = weekdays.map((_, index) => addDays(week, index))
  const lastDate = addDays(week, 4)
  const db = getDb()
  const slots = await db
    .select()
    .from(shiftSlots)
    .orderBy(asc(shiftSlots.startTime), asc(shiftSlots.id))
  const rows = await db
    .select({
      boardPosition: bookings.boardPosition,
      date: bookings.date,
      displayName: bookings.displayName,
      id: bookings.id,
      memberId: bookings.memberId,
      shiftSlotId: bookings.shiftSlotId,
    })
    .from(bookings)
    .where(and(gte(bookings.date, week), lte(bookings.date, lastDate)))
    .orderBy(asc(bookings.date), asc(bookings.createdAt))

  return {
    currentWeek,
    days: dates.map((date, index) => ({
      date,
      label: weekdays[index],
      shifts: slots.map((slot) => ({
        bookings: rows
          .filter(
            (booking) =>
              booking.date === date && booking.shiftSlotId === slot.id,
          )
          .map(({ displayName, boardPosition, id, memberId }) => ({
            boardPosition,
            displayName,
            ownBookingId: memberId === input.viewerMemberId ? id : undefined,
            overrideBookingId: input.viewerCanOverride ? id : undefined,
          })),
        endTime: slot.endTime,
        id: slot.id,
        startTime: slot.startTime,
      })),
    })),
    week,
  }
}

function asDateString(value: Date) {
  return value.toISOString().slice(0, 10)
}

const torontoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Toronto',
  year: 'numeric',
})
