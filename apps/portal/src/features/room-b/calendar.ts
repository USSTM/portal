import { and, asc, gte, isNull, lte } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import { roomBBookings } from '../../db/schema.js'
import { addDays, currentTorontoMonday } from '../office-hours/calendar.js'
import { roomBWeek } from './policy.js'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// Calendar projection deliberately excludes member IDs, creator identity,
// cancellation history, emails, and private booking-management information.
export async function getRoomBCalendar(
  input: { week?: string; now?: Date } = {},
) {
  const now = input.now ?? new Date()
  const currentWeek = currentTorontoMonday(now)
  const week = roomBWeek(input.week, now)
  const reservations = await getDb()
    .select({
      date: roomBBookings.date,
      startHour: roomBBookings.startHour,
      ownerLabel: roomBBookings.ownerLabel,
      boardPosition: roomBBookings.boardPosition,
    })
    .from(roomBBookings)
    .where(
      and(
        isNull(roomBBookings.cancelledAt),
        gte(roomBBookings.date, week),
        lte(roomBBookings.date, addDays(week, 4)),
      ),
    )
    .orderBy(asc(roomBBookings.date), asc(roomBBookings.startHour))
  return {
    week,
    currentWeek,
    nextBookableWeek: addDays(currentWeek, 7),
    days: days.map((label, index) => {
      const date = addDays(week, index)
      return {
        label,
        date,
        slots: Array.from({ length: 14 }, (_, offset) => {
          const startHour = 8 + offset
          const reservation = reservations.find(
            (booking) =>
              booking.date === date && booking.startHour === startHour,
          )
          return {
            startHour,
            endHour: startHour + 1,
            booking: reservation
              ? {
                  ownerLabel: reservation.ownerLabel,
                  boardPosition: reservation.boardPosition,
                }
              : null,
          }
        }),
      }
    }),
  }
}
