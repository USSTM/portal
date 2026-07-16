import { and, count, eq, gte, inArray, lte } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import {
  auditEntries,
  boardMembers,
  bookings,
  members,
  shiftSlots,
} from '../../db/schema.js'

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

export async function listActiveBoardMembers() {
  return getDb()
    .select({
      boardPosition: boardMembers.boardPosition,
      displayName: members.displayName,
      id: members.id,
    })
    .from(members)
    .innerJoin(boardMembers, eq(boardMembers.memberId, members.id))
    .where(eq(members.lifecycle, 'active'))
}

export async function createOverrideBooking(input: {
  actorEmail: string
  date: string
  memberId: string
  now?: Date
  shiftSlotId: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const member = await findBoardMemberById(tx, input.memberId)
    const slot = await findSlot(tx, input.shiftSlotId)
    if (shiftStart(input.date, slot.startTime) <= (input.now ?? new Date())) {
      throw new Error('This Shift has already started')
    }
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
    await writeBookingAudit(
      tx,
      input.actorEmail,
      'booking.override_created',
      booking,
    )
    return booking
  })
}

export async function cancelOverrideBooking(input: {
  actorEmail: string
  bookingId: string
  now?: Date
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const booking = await findBooking(tx, input.bookingId)
    if (!booking) throw new Error('Booking not found')
    if (
      shiftStart(booking.date, booking.startTime) <= (input.now ?? new Date())
    ) {
      throw new Error('This Shift has already started')
    }
    await tx.delete(bookings).where(eq(bookings.id, booking.id))
    await writeBookingAudit(
      tx,
      input.actorEmail,
      'booking.override_cancelled',
      booking,
    )
  })
}

export async function cancelFutureBookingsForMember(
  tx: Transaction,
  memberId: string,
  now = new Date(),
) {
  const memberBookings = await tx
    .select({
      date: bookings.date,
      id: bookings.id,
      startTime: shiftSlots.startTime,
    })
    .from(bookings)
    .innerJoin(shiftSlots, eq(shiftSlots.id, bookings.shiftSlotId))
    .where(eq(bookings.memberId, memberId))
  const futureIds = memberBookings
    .filter((booking) => shiftStart(booking.date, booking.startTime) > now)
    .map((booking) => booking.id)
  if (futureIds.length > 0) {
    await tx.delete(bookings).where(inArray(bookings.id, futureIds))
  }
  return futureIds.length
}

export async function updateFutureBookingSnapshots(
  tx: Transaction,
  input: {
    boardPosition: string
    displayName: string
    memberId: string
    now?: Date
  },
) {
  const memberBookings = await tx
    .select({
      date: bookings.date,
      id: bookings.id,
      startTime: shiftSlots.startTime,
    })
    .from(bookings)
    .innerJoin(shiftSlots, eq(shiftSlots.id, bookings.shiftSlotId))
    .where(eq(bookings.memberId, input.memberId))
  const futureIds = memberBookings
    .filter(
      (booking) =>
        shiftStart(booking.date, booking.startTime) > (input.now ?? new Date()),
    )
    .map((booking) => booking.id)
  if (futureIds.length > 0) {
    await tx
      .update(bookings)
      .set({
        boardPosition: input.boardPosition,
        displayName: input.displayName,
      })
      .where(inArray(bookings.id, futureIds))
  }
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

async function findBoardMemberById(tx: Transaction, memberId: string) {
  const member = (
    await tx
      .select({
        boardPosition: boardMembers.boardPosition,
        displayName: members.displayName,
        id: members.id,
      })
      .from(members)
      .innerJoin(boardMembers, eq(boardMembers.memberId, members.id))
      .where(and(eq(members.id, memberId), eq(members.lifecycle, 'active')))
      .for('update')
  ).at(0)
  if (!member) throw new Error('Board Member not found')
  return member
}

async function findSlot(tx: Transaction, shiftSlotId: string) {
  const slot = (
    await tx.select().from(shiftSlots).where(eq(shiftSlots.id, shiftSlotId))
  ).at(0)
  if (!slot) throw new Error('Shift Slot not found')
  return slot
}

async function findBooking(tx: Transaction, bookingId: string) {
  return (
    await tx
      .select({
        date: bookings.date,
        id: bookings.id,
        memberId: bookings.memberId,
        shiftSlotId: bookings.shiftSlotId,
        startTime: shiftSlots.startTime,
      })
      .from(bookings)
      .innerJoin(shiftSlots, eq(shiftSlots.id, bookings.shiftSlotId))
      .where(eq(bookings.id, bookingId))
      .for('update')
  ).at(0)
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

async function writeBookingAudit(
  tx: Transaction,
  actorEmail: string,
  action: string,
  booking: { date: string; id: string; memberId: string; shiftSlotId: string },
) {
  await tx.insert(auditEntries).values({
    action,
    actorEmail: actorEmail.trim().toLowerCase(),
    changedValues: {
      date: booking.date,
      memberId: booking.memberId,
      shiftSlotId: booking.shiftSlotId,
    },
    targetId: booking.id,
    targetType: 'booking',
  })
}

type Transaction = Parameters<
  ReturnType<typeof getDb>['transaction']
>[0] extends (tx: infer InferredTransaction) => unknown
  ? InferredTransaction
  : never
