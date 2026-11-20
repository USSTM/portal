import { and, asc, eq, gte, isNull, lte, sql } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import {
  administrators,
  auditEntries,
  boardMembers,
  clubAccess,
  clubs,
  members,
  roomBBookings,
} from '../../db/schema.js'
import { addDays } from '../office-hours/calendar.js'
import {
  requireRoomBBookingWindow,
  roomBBookingInput,
  roomBOverwriteInput,
  roomBHourStart,
  roomBWeek,
} from './policy.js'

import type {
  RoomBBookingInput,
  RoomBOwner,
  RoomBOverwriteInput,
} from './policy.js'

type Database = ReturnType<typeof getDb>
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
type Booking = typeof roomBBookings.$inferSelect

// One physical room has little write contention. Serialize its mutations so
// shared club quotas and multi-hour reservations are checked atomically, even
// across server processes. PostgreSQL releases this lock on commit/rollback.
export const lockRoomB = (tx: Transaction) =>
  tx.execute(sql`SELECT pg_advisory_xact_lock(827466, 1)`)

// Called by grant/lifecycle changes in the same transaction as their audit
// entry. Callers acquire lockRoomB before changing Members, grants or Clubs.
export async function cancelFutureRoomBBookings(
  tx: Transaction,
  input: { owner: RoomBOwner; actorEmail: string; now?: Date },
) {
  const now = input.now ?? new Date()
  const cancelled = await tx
    .update(roomBBookings)
    .set({
      cancelledAt: now,
      cancelledByEmail: input.actorEmail.trim().toLowerCase(),
    })
    .where(
      and(
        input.owner.kind === 'club'
          ? eq(roomBBookings.clubId, input.owner.clubId)
          : eq(roomBBookings.memberId, input.owner.memberId),
        isNull(roomBBookings.cancelledAt),
        sql`((${roomBBookings.date} + make_time(${roomBBookings.startHour}, 0, 0)) AT TIME ZONE 'America/Toronto') > ${now.toISOString()}::timestamptz`,
      ),
    )
    .returning({ id: roomBBookings.id })
  return cancelled.length
}

export async function createRoomBBooking(
  input: RoomBBookingInput & { actorEmail: string; now?: Date },
) {
  const data = roomBBookingInput.parse(input)
  return getDb().transaction(async (tx) => {
    await lockRoomB(tx)
    const actor = await requireActor(tx, input.actorEmail)
    return insertRoomBBooking(tx, data, actor, input.now ?? new Date())
  })
}

async function insertRoomBBooking(
  tx: Transaction,
  data: RoomBBookingInput,
  actor: Actor,
  now: Date,
) {
  const week = requireRoomBBookingWindow(data.date, data.startHour, now)
  const owner = await requireOwner(tx, actor, data.owner)
  const hours = data.endHour - data.startHour
  const reservations = await tx
    .select()
    .from(roomBBookings)
    .where(
      and(
        isNull(roomBBookings.cancelledAt),
        gte(roomBBookings.date, week),
        lte(roomBBookings.date, addDays(week, 6)),
      ),
    )
  if (
    reservations.some(
      (booking) =>
        booking.date === data.date &&
        booking.startHour >= data.startHour &&
        booking.startHour < data.endHour,
    )
  ) {
    throw new Error('EPH 442B is already booked for the selected time')
  }
  const usage = reservations.filter((booking) => belongsTo(booking, data.owner))
  if (!owner.unlimited) {
    if (
      usage.filter((booking) => booking.date === data.date).length + hours >
      2
    ) {
      throw new Error(
        'EPH 442B bookings are limited to 2 hours per day for this owner',
      )
    }
    if (usage.length + hours > 6) {
      throw new Error(
        'EPH 442B bookings are limited to 6 hours per week for this owner',
      )
    }
  }
  const created = await tx
    .insert(roomBBookings)
    .values(
      Array.from({ length: hours }, (_, offset) => ({
        date: data.date,
        startHour: data.startHour + offset,
        clubId: data.owner.kind === 'club' ? data.owner.clubId : null,
        memberId:
          data.owner.kind === 'boardMember' ? data.owner.memberId : null,
        bookedByMemberId: actor.id,
        bookedByEmail: actor.email,
        ownerLabel: owner.label,
        boardPosition: owner.boardPosition,
      })),
    )
    .returning()
  if (actor.isAdministrator && !isSelf(data.owner, actor.id)) {
    for (const booking of created) {
      await auditAdministratorBooking(
        tx,
        actor.email,
        'room_b_booking.created_for_owner',
        booking,
      )
    }
  }
  return created.map(({ id, date, startHour }) => ({
    id,
    date,
    startHour,
    endHour: startHour + 1,
  }))
}

export async function overwriteRoomBBooking(
  input: RoomBOverwriteInput & { actorEmail: string; now?: Date },
) {
  const data = roomBOverwriteInput.parse(input)
  return getDb().transaction(async (tx) => {
    await lockRoomB(tx)
    const actor = await requireActor(tx, input.actorEmail)
    if (!actor.isAdministrator)
      throw new Error('Administrator authority is required')
    const booking = (
      await tx
        .select()
        .from(roomBBookings)
        .where(
          and(
            eq(roomBBookings.id, data.bookingId),
            isNull(roomBBookings.cancelledAt),
          ),
        )
    ).at(0)
    if (!booking)
      throw new Error(
        'This booking has changed. Refresh the calendar and try again.',
      )
    const now = input.now ?? new Date()
    requireRoomBBookingWindow(booking.date, booking.startHour, now)
    await tx
      .update(roomBBookings)
      .set({ cancelledAt: now, cancelledByEmail: actor.email })
      .where(eq(roomBBookings.id, booking.id))
    // The replacement uses normal owner quotas after releasing the old hour.
    // Any failure rolls back this cancellation as well as the replacement.
    const [replacement] = await insertRoomBBooking(
      tx,
      {
        date: booking.date,
        startHour: booking.startHour,
        endHour: booking.startHour + 1,
        owner: data.owner,
      },
      actor,
      now,
    )
    await tx.insert(auditEntries).values({
      actorEmail: actor.email,
      action: 'room_b_booking.overwritten',
      targetType: 'room_b_booking',
      targetId: booking.id,
      changedValues: {
        date: booking.date,
        startHour: booking.startHour,
        previousOwner: { clubId: booking.clubId, memberId: booking.memberId },
        replacementOwner: data.owner,
        replacementBookingId: replacement.id,
      },
    })
    return replacement
  })
}

export async function cancelRoomBBooking(input: {
  actorEmail: string
  bookingId: string
  now?: Date
}) {
  return getDb().transaction(async (tx) => {
    await lockRoomB(tx)
    const actor = await requireActor(tx, input.actorEmail)
    const booking = (
      await tx
        .select()
        .from(roomBBookings)
        .where(
          and(
            eq(roomBBookings.id, input.bookingId),
            isNull(roomBBookings.cancelledAt),
          ),
        )
    ).at(0)
    if (!booking) throw new Error('EPH 442B booking not found')
    const access = actor.id ? await actorClubIds(tx, actor.id) : []
    if (!canCancel(booking, actor, access)) throw new Error('Access denied')
    const now = input.now ?? new Date()
    if (roomBHourStart(booking.date, booking.startHour) <= now) {
      throw new Error('This EPH 442B booking has already started')
    }
    await tx
      .update(roomBBookings)
      .set({ cancelledAt: now, cancelledByEmail: actor.email })
      .where(eq(roomBBookings.id, booking.id))
    if (actor.isAdministrator) {
      await auditAdministratorBooking(
        tx,
        actor.email,
        'room_b_booking.cancelled_for_owner',
        booking,
      )
    }
    return { id: booking.id }
  })
}

export async function getRoomBBookingContext(input: {
  actorEmail: string
  week?: string
  now?: Date
}) {
  const db = getDb()
  const now = input.now ?? new Date()
  const week = roomBWeek(input.week, now)
  const actor = await requireActor(db, input.actorEmail)
  const access = actor.id ? await actorClubIds(db, actor.id) : []
  const availableClubs = await db
    .select({ id: clubs.id, label: clubs.shortName })
    .from(clubs)
    .where(eq(clubs.lifecycle, 'active'))
    .orderBy(asc(clubs.shortName))
  const availableMembers = await db
    .select({
      id: members.id,
      label: members.displayName,
      email: members.email,
      boardPosition: boardMembers.boardPosition,
      administratorId: administrators.memberId,
    })
    .from(members)
    .innerJoin(boardMembers, eq(boardMembers.memberId, members.id))
    .leftJoin(administrators, eq(administrators.memberId, members.id))
    .where(
      and(
        eq(members.lifecycle, 'active'),
        actor.isAdministrator
          ? undefined
          : actor.id === null
            ? sql`false`
            : eq(members.id, actor.id),
      ),
    )
    .orderBy(asc(members.displayName), asc(members.id))
  const reservations = await db
    .select()
    .from(roomBBookings)
    .where(
      and(
        isNull(roomBBookings.cancelledAt),
        gte(roomBBookings.date, week),
        lte(roomBBookings.date, addDays(week, 6)),
      ),
    )
    .orderBy(asc(roomBBookings.date), asc(roomBBookings.startHour))
  const options = [
    ...availableClubs
      .filter((club) => actor.isAdministrator || access.includes(club.id))
      .map((club) => ({
        owner: { kind: 'club' as const, clubId: club.id },
        label: club.label,
        boardPosition: null,
        unlimited: false,
      })),
    ...availableMembers.map((member) => ({
      owner: { kind: 'boardMember' as const, memberId: member.id },
      label: member.label,
      boardPosition: member.boardPosition,
      unlimited:
        member.administratorId !== null || isSuperuserEmail(member.email),
    })),
  ]
  return {
    week,
    isAdministrator: actor.isAdministrator,
    defaultOwner:
      actor.isAdministrator && actor.id !== null && actor.boardPosition !== null
        ? { kind: 'boardMember' as const, memberId: actor.id }
        : null,
    owners: options.map((option) => {
      const usage = reservations.filter((booking) =>
        belongsTo(booking, option.owner),
      )
      return {
        ...option,
        weeklyHoursUsed: usage.length,
        weeklyHoursRemaining: option.unlimited
          ? null
          : Math.max(0, 6 - usage.length),
        days: Array.from({ length: 5 }, (_, index) => {
          const date = addDays(week, index)
          const hoursUsed = usage.filter(
            (booking) => booking.date === date,
          ).length
          return {
            date,
            hoursUsed,
            hoursRemaining: option.unlimited
              ? null
              : Math.max(0, 2 - hoursUsed),
          }
        }),
      }
    }),
    cancellableBookings: reservations
      .filter(
        (booking) =>
          canCancel(booking, actor, access) &&
          roomBHourStart(booking.date, booking.startHour) > now,
      )
      .map(({ id, date, startHour }) => ({ id, date, startHour })),
  }
}

async function requireActor(db: Database | Transaction, email: string) {
  email = email.trim().toLowerCase()
  if (isSuperuserEmail(email)) {
    // The deployment-owned Superuser has Administrator authority without
    // requiring or provisioning a Member/Administrator database record.
    const member = (
      await db
        .select({ id: members.id })
        .from(members)
        .where(and(eq(members.email, email), eq(members.lifecycle, 'active')))
    ).at(0)
    const board = member
      ? (
          await db
            .select()
            .from(boardMembers)
            .where(eq(boardMembers.memberId, member.id))
        ).at(0)
      : undefined
    return {
      id: member?.id ?? null,
      email,
      boardPosition: board?.boardPosition ?? null,
      isAdministrator: true,
    }
  }
  const actor = (
    await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.email, email.trim().toLowerCase()),
          eq(members.lifecycle, 'active'),
        ),
      )
  ).at(0)
  if (!actor) throw new Error('Active Member authority is required')
  const board = (
    await db
      .select()
      .from(boardMembers)
      .where(eq(boardMembers.memberId, actor.id))
  ).at(0)
  const administrator = (
    await db
      .select({ memberId: administrators.memberId })
      .from(administrators)
      .where(eq(administrators.memberId, actor.id))
  ).at(0)
  return {
    ...actor,
    boardPosition: board?.boardPosition ?? null,
    isAdministrator: administrator !== undefined,
  }
}

type Actor = Awaited<ReturnType<typeof requireActor>>

async function actorClubIds(db: Database | Transaction, memberId: string) {
  const access = await db
    .select({ id: clubs.id })
    .from(clubAccess)
    .innerJoin(clubs, eq(clubs.id, clubAccess.clubId))
    .where(
      and(eq(clubAccess.memberId, memberId), eq(clubs.lifecycle, 'active')),
    )
  return access.map((club) => club.id)
}

async function requireOwner(tx: Transaction, actor: Actor, owner: RoomBOwner) {
  if (owner.kind === 'club') {
    const club = (
      await tx
        .select()
        .from(clubs)
        .where(and(eq(clubs.id, owner.clubId), eq(clubs.lifecycle, 'active')))
    ).at(0)
    if (
      !club ||
      (!actor.isAdministrator &&
        (!actor.id || !(await actorClubIds(tx, actor.id)).includes(club.id)))
    ) {
      throw new Error('Club Access is required for the selected active Club')
    }
    return { label: club.shortName, boardPosition: null, unlimited: false }
  }
  if (!actor.isAdministrator && actor.id !== owner.memberId)
    throw new Error('Access denied')
  const member = (
    await tx
      .select({
        label: members.displayName,
        email: members.email,
        boardPosition: boardMembers.boardPosition,
        administratorId: administrators.memberId,
      })
      .from(members)
      .innerJoin(boardMembers, eq(boardMembers.memberId, members.id))
      .leftJoin(administrators, eq(administrators.memberId, members.id))
      .where(
        and(eq(members.id, owner.memberId), eq(members.lifecycle, 'active')),
      )
  ).at(0)
  if (!member) throw new Error('Active Board Member authority is required')
  return {
    label: member.label,
    boardPosition: member.boardPosition,
    unlimited:
      member.administratorId !== null || isSuperuserEmail(member.email),
  }
}

function belongsTo(booking: Booking, owner: RoomBOwner) {
  return owner.kind === 'club'
    ? booking.clubId === owner.clubId
    : booking.memberId === owner.memberId
}

function isSelf(owner: RoomBOwner, memberId: string | null) {
  return owner.kind === 'boardMember' && owner.memberId === memberId
}

function canCancel(booking: Booking, actor: Actor, clubIds: string[]) {
  return (
    actor.isAdministrator ||
    (actor.id !== null &&
      booking.memberId === actor.id &&
      actor.boardPosition !== null) ||
    (booking.clubId !== null && clubIds.includes(booking.clubId))
  )
}

async function auditAdministratorBooking(
  tx: Transaction,
  email: string,
  action: string,
  booking: Booking,
) {
  await tx.insert(auditEntries).values({
    actorEmail: email,
    action,
    targetType: 'room_b_booking',
    targetId: booking.id,
    changedValues: {
      date: booking.date,
      startHour: booking.startHour,
      clubId: booking.clubId,
      memberId: booking.memberId,
      bookedByMemberId: booking.bookedByMemberId,
      bookedByEmail: booking.bookedByEmail,
    },
  })
}

function isSuperuserEmail(email: string) {
  const configured = process.env.PORTAL_SUPERUSER_EMAIL?.trim().toLowerCase()
  return (
    configured !== undefined && configured.length > 0 && email === configured
  )
}
