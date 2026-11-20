import { and, asc, gte, isNull, lte } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { roomBBookings } from '../../db/schema.js'
import {
  defaultScheduleDate,
  scheduleDates,
  scheduleMonday,
  torontoDate,
  isRoomBWeekday,
  addScheduleDays,
} from './schedule-dates.js'
import { roomBDateSchema, roomBHourStart } from './policy.js'
import type { RoomBView } from './schedule-dates.js'

const projection = {
  date: roomBBookings.date,
  startHour: roomBBookings.startHour,
  ownerLabel: roomBBookings.ownerLabel,
  boardPosition: roomBBookings.boardPosition,
}
const weekdayFormatter = new Intl.DateTimeFormat('en-CA', {
  weekday: 'long',
  timeZone: 'UTC',
})

export async function getRoomBSchedule(
  input: { date?: string; view?: RoomBView; now?: Date } = {},
) {
  const now = input.now ?? new Date()
  const date = roomBDateSchema.parse(input.date ?? defaultScheduleDate(now))
  const dates = scheduleDates(date, input.view ?? 'week')
  const rows = await getDb()
    .select(projection)
    .from(roomBBookings)
    .where(
      and(
        isNull(roomBBookings.cancelledAt),
        gte(roomBBookings.date, dates[0]),
        lte(roomBBookings.date, dates[dates.length - 1]),
      ),
    )
    .orderBy(asc(roomBBookings.date), asc(roomBBookings.startHour))
  const byHour = new Map(
    rows.map((row) => [`${row.date}:${row.startHour}`, row]),
  )
  const currentWeek = scheduleMonday(torontoDate(now))
  return {
    date,
    week: scheduleMonday(date),
    currentWeek,
    nextBookableWeek: addScheduleDays(currentWeek, 7),
    days: dates.map((day) => ({
      date: day,
      label: weekdayFormatter.format(new Date(`${day}T12:00:00Z`)),
      slots: isRoomBWeekday(day)
        ? Array.from({ length: 14 }, (_, offset) => {
            const startHour = offset + 8
            const row = byHour.get(`${day}:${startHour}`)
            return {
              startHour,
              endHour: startHour + 1,
              booking: row
                ? {
                    ownerLabel: row.ownerLabel,
                    boardPosition: row.boardPosition,
                  }
                : null,
            }
          })
        : [],
    })),
  }
}

export async function getRoomBDisplaySchedule(now = new Date()) {
  const date = torontoDate(now)
  // At most 14 hours today plus the following reservations. Owner keys are
  // used only to merge adjacent hours and never leave the server.
  const rows = await getDb()
    .select({
      ...projection,
      clubId: roomBBookings.clubId,
      memberId: roomBBookings.memberId,
    })
    .from(roomBBookings)
    .where(
      and(isNull(roomBBookings.cancelledAt), gte(roomBBookings.date, date)),
    )
    .orderBy(asc(roomBBookings.date), asc(roomBBookings.startHour))
    .limit(42)
  const merged: Array<{
    date: string
    startHour: number
    endHour: number
    ownerLabel: string
    boardPosition: string | null
    key: string
  }> = []
  for (const row of rows) {
    const key = row.clubId ?? row.memberId ?? ''
    const previous = merged.at(-1)
    if (
      previous &&
      previous.date === row.date &&
      previous.endHour === row.startHour &&
      previous.key === key &&
      previous.ownerLabel === row.ownerLabel &&
      previous.boardPosition === row.boardPosition
    )
      previous.endHour++
    else merged.push({ ...row, key, endHour: row.startHour + 1 })
  }
  const reservations = merged.map((row) => ({
    date: row.date,
    startHour: row.startHour,
    endHour: row.endHour,
    ownerLabel: row.ownerLabel,
    boardPosition: row.boardPosition,
    startAt: roomBHourStart(row.date, row.startHour).toISOString(),
    endAt: roomBHourStart(row.date, row.endHour).toISOString(),
  }))
  return {
    date,
    updatedAt: now.toISOString(),
    reservations: reservations.filter((row) => row.date === date),
    nextReservation:
      reservations.find((row) => Date.parse(row.startAt) > now.getTime()) ??
      null,
  }
}
