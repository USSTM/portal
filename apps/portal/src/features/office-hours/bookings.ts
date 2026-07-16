import { and, count, eq, gte, lte } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import { boardMembers, bookings, members, shiftSlots } from '../../db/schema.js'

import { addDays, currentTorontoMonday, mondayForDate } from './calendar.js'
import { torontoLocalDateTime } from './time.js'

export async function createOwnBooking(input: {
  actorEmail: string
  date: string
  now?: Date
  shiftSlotId: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const member = await findActiveBoardMember(tx, input.actorEmail)
    const week = requireEligibleWeek(input.date, input.now)
    const slot = await findSlot(tx, input.shiftSlotId)
    if (shiftStart(input.date, slot.startTime) <= (input.now ?? new Date())) {
      throw new Error('This Shift has already started')
    }
    const existing = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.memberId, member.id),
          eq(bookings.date, input.date),
          eq(bookings.shiftSlotId, input.shiftSlotId),
        ),
      )
    if (existing.length > 0) throw new Error('You already booked this Shift')
    const [{ total }] = await tx
      .select({ total: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.memberId, member.id),
          gte(bookings.date, week),
          lte(bookings.date, addDays(week, 6)),
        ),
      )
    if (total >= 5) throw new Error('You can book at most five Shifts per week')
    const [booking] = await tx
      .insert(bookings)
      .values({
        boardPosition: member.boardPosition,
        date: input.date,
        displayName: member.displayName,
        memberId: member.id,
        shiftSlotId: slot.id,
      })
      .returning()
    return booking
  })
}

export async function cancelOwnBooking(input: {
  actorEmail: string
  bookingId: string
  now?: Date
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const member = await findActiveBoardMember(tx, input.actorEmail)
    const booking = (
      await tx
        .select({
          date: bookings.date,
          id: bookings.id,
          memberId: bookings.memberId,
          startTime: shiftSlots.startTime,
        })
        .from(bookings)
        .innerJoin(shiftSlots, eq(shiftSlots.id, bookings.shiftSlotId))
        .where(eq(bookings.id, input.bookingId))
        .for('update')
    ).at(0)
    if (!booking || booking.memberId !== member.id)
      throw new Error('Booking not found')
    if (
      shiftStart(booking.date, booking.startTime) <= (input.now ?? new Date())
    ) {
      throw new Error('This Shift has already started')
    }
    await tx.delete(bookings).where(eq(bookings.id, booking.id))
  })
}

export async function findBoardMemberId(email: string) {
  const found = await getDb()
    .select({ id: members.id })
    .from(members)
    .innerJoin(boardMembers, eq(boardMembers.memberId, members.id))
    .where(and(eq(members.email, email), eq(members.lifecycle, 'active')))
  return found.at(0)?.id
}

async function findActiveBoardMember(tx: Transaction, email: string) {
  const found = await tx
    .select({
      boardPosition: boardMembers.boardPosition,
      displayName: members.displayName,
      id: members.id,
    })
    .from(members)
    .innerJoin(boardMembers, eq(boardMembers.memberId, members.id))
    .where(and(eq(members.email, email), eq(members.lifecycle, 'active')))
    .for('update')
  const member = found.at(0)
  if (!member) throw new Error('Board Member authority is required')
  return member
}

async function findSlot(tx: Transaction, shiftSlotId: string) {
  const slot = (
    await tx.select().from(shiftSlots).where(eq(shiftSlots.id, shiftSlotId))
  ).at(0)
  if (!slot) throw new Error('Shift Slot not found')
  return slot
}

function requireEligibleWeek(date: string, now?: Date) {
  const week = mondayForDate(date)
  const currentWeek = currentTorontoMonday(now)
  if (!week || (week !== currentWeek && week !== addDays(currentWeek, 7))) {
    throw new Error('Bookings are limited to the current or next Toronto week')
  }
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  if (weekday === 0 || weekday === 6)
    throw new Error('Bookings are weekdays only')
  return week
}

function shiftStart(date: string, startTime: string) {
  return torontoLocalDateTime(`${date}T${startTime.slice(0, 5)}`)!
}

type Transaction = Parameters<
  ReturnType<typeof getDb>['transaction']
>[0] extends (tx: infer InferredTransaction) => unknown
  ? InferredTransaction
  : never
