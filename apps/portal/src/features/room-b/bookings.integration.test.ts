import { and, eq, isNull } from 'drizzle-orm'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
import {
  cancelRoomBBooking,
  createRoomBBooking,
  getRoomBBookingContext,
  overwriteRoomBBooking,
} from './bookings.js'
import { getRoomBCalendar } from './calendar.js'
import { getRoomBDisplaySchedule, getRoomBSchedule } from './schedule.js'
import { deactivateMember } from '../admin/members.js'
import { revokeBoardAuthority } from '../admin/board-members.js'
import {
  deactivateAdministrator,
  revokeBoardPositionFromAdministrator,
} from '../admin/administrators.js'
import { archiveClub } from '../admin/clubs.js'

import type { RoomBOwner } from './policy.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip
const now = new Date('2030-01-07T12:00:00Z')

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describeWithDatabase('Room B bookings', () => {
  it.each(['administrator', 'superuser'] as const)(
    'lets an %s overwrite and delete bookings created by other people',
    async (kind) => {
      const owner = await createMember('Director')
      const replacementOwner = await createMember('Director')
      const actor =
        kind === 'administrator'
          ? await createMember()
          : { email: 'superuser@example.com' }
      if ('id' in actor)
        await getDb().insert(administrators).values({ memberId: actor.id })
      else vi.stubEnv('PORTAL_SUPERUSER_EMAIL', actor.email)
      const [original] = await reserve(owner, personal(owner), '2030-01-07', 8)
      expect(
        (await getRoomBBookingContext({ actorEmail: actor.email, now }))
          .cancellableBookings,
      ).toContainEqual({ id: original.id, date: '2030-01-07', startHour: 8 })
      const replacement = await overwriteRoomBBooking({
        actorEmail: actor.email,
        bookingId: original.id,
        owner: personal(replacementOwner),
        confirmed: true,
        now,
      })
      const rows = await getDb().select().from(roomBBookings)
      expect(rows.find((row) => row.id === original.id)).toMatchObject({
        cancelledAt: now,
        cancelledByEmail: actor.email,
      })
      expect(rows.find((row) => row.id === replacement.id)).toMatchObject({
        memberId: replacementOwner.id,
        bookedByEmail: actor.email,
        cancelledAt: null,
      })
      const audit = await getDb()
        .select()
        .from(auditEntries)
        .where(eq(auditEntries.targetId, original.id))
      expect(audit).toContainEqual(
        expect.objectContaining({
          action: 'room_b_booking.overwritten',
          actorEmail: actor.email,
          changedValues: expect.objectContaining({
            replacementBookingId: replacement.id,
          }),
        }),
      )
      await expect(
        overwriteRoomBBooking({
          actorEmail: actor.email,
          bookingId: original.id,
          owner: personal(owner),
          confirmed: true,
          now,
        }),
      ).rejects.toThrow('has changed')
      const [otherBooking] = await reserve(
        owner,
        personal(owner),
        '2030-01-08',
        8,
      )
      await cancelRoomBBooking({
        actorEmail: actor.email,
        bookingId: otherBooking.id,
        now,
      })
      expect(
        (
          await getDb()
            .select()
            .from(roomBBookings)
            .where(eq(roomBBookings.id, otherBooking.id))
        ).at(0),
      ).toMatchObject({ cancelledAt: now, cancelledByEmail: actor.email })
    },
  )

  it('rolls back a failed overwrite and permits replacing the same owner at their quota', async () => {
    const actor = await createMember()
    await getDb().insert(administrators).values({ memberId: actor.id })
    const member = await createMember('Director')
    const club = await createClub()
    await grantClub(member.id, club.id)
    const [original] = await reserve(member, personal(member), '2030-01-07', 8)
    const clubOwner: RoomBOwner = { kind: 'club', clubId: club.id }
    const [full] = await reserve(member, clubOwner, '2030-01-07', 10, 12)
    await expect(
      overwriteRoomBBooking({
        actorEmail: actor.email,
        bookingId: original.id,
        owner: clubOwner,
        confirmed: true,
        now,
      }),
    ).rejects.toThrow('2 hours per day')
    expect(
      (
        await getDb()
          .select()
          .from(roomBBookings)
          .where(eq(roomBBookings.id, original.id))
      ).at(0)?.cancelledAt,
    ).toBeNull()
    const replacement = await overwriteRoomBBooking({
      actorEmail: actor.email,
      bookingId: full.id,
      owner: clubOwner,
      confirmed: true,
      now,
    })
    expect(replacement.startHour).toBe(10)
    expect(
      (
        await getRoomBBookingContext({ actorEmail: member.email, now })
      ).owners.find((option) => option.owner.kind === 'club')?.days[0]
        .hoursUsed,
    ).toBe(2)
    await expect(
      overwriteRoomBBooking({
        actorEmail: member.email,
        bookingId: original.id,
        owner: clubOwner,
        confirmed: true,
        now,
      }),
    ).rejects.toThrow('Administrator authority')
    await expect(
      overwriteRoomBBooking({
        actorEmail: actor.email,
        bookingId: original.id,
        owner: personal(member),
        confirmed: true,
        now: new Date('2030-01-07T13:00:00Z'),
      }),
    ).rejects.toThrow('already started')
  })

  it('prevents two administrators from replacing the same stale booking', async () => {
    const member = await createMember('Director')
    const alice = await createMember('Director')
    const bob = await createMember('Director')
    await getDb()
      .insert(administrators)
      .values([{ memberId: alice.id }, { memberId: bob.id }])
    const [original] = await reserve(member, personal(member), '2030-01-07', 8)
    const results = await Promise.allSettled(
      [alice, bob].map((actor) =>
        overwriteRoomBBooking({
          actorEmail: actor.email,
          bookingId: original.id,
          owner: personal(actor),
          confirmed: true,
          now,
        }),
      ),
    )
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1)
    expect(
      await getDb()
        .select()
        .from(roomBBookings)
        .where(isNull(roomBBookings.cancelledAt)),
    ).toHaveLength(1)
  })

  it('lets the configured Superuser book and cancel for active owners without a Member record', async () => {
    const email = 'superuser@example.com'
    vi.stubEnv('PORTAL_SUPERUSER_EMAIL', ' SUPERUSER@example.com ')
    const club = await createClub()
    const board = await createMember('Director')
    const context = await getRoomBBookingContext({ actorEmail: email, now })
    expect(context.isAdministrator).toBe(true)
    expect(context.defaultOwner).toBeNull()
    expect(
      context.owners.some(
        (option) =>
          option.owner.kind === 'club' && option.owner.clubId === club.id,
      ),
    ).toBe(true)
    expect(
      context.owners.some(
        (option) =>
          option.owner.kind === 'boardMember' &&
          option.owner.memberId === board.id,
      ),
    ).toBe(true)
    const [booking] = await reserve(
      { email },
      { kind: 'club', clubId: club.id },
      '2030-01-07',
      8,
    )
    const stored = (
      await getDb()
        .select()
        .from(roomBBookings)
        .where(eq(roomBBookings.id, booking.id))
    ).at(0)
    expect(stored).toMatchObject({
      bookedByMemberId: null,
      bookedByEmail: email,
      clubId: club.id,
    })
    expect(
      (await getRoomBBookingContext({ actorEmail: email, now }))
        .cancellableBookings,
    ).toContainEqual({ id: booking.id, date: '2030-01-07', startHour: 8 })
    await cancelRoomBBooking({ actorEmail: email, bookingId: booking.id, now })
    await reserve({ email }, personal(board), '2030-01-07', 8, 10)
    await expect(
      reserve({ email }, personal(board), '2030-01-07', 10),
    ).rejects.toThrow('2 hours per day')
    expect(
      await getDb().select().from(members).where(eq(members.email, email)),
    ).toHaveLength(0)
    const audit = await getDb()
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, booking.id))
    expect(audit.map((entry) => entry.action)).toEqual([
      'room_b_booking.created_for_owner',
      'room_b_booking.cancelled_for_owner',
    ])
    expect(audit.every((entry) => entry.actorEmail === email)).toBe(true)
    await expect(
      getRoomBBookingContext({ actorEmail: 'superuser+fake@example.com', now }),
    ).rejects.toThrow('Active Member')
    vi.stubEnv('PORTAL_SUPERUSER_EMAIL', 'replacement@example.com')
    await expect(
      getRoomBBookingContext({ actorEmail: email, now }),
    ).rejects.toThrow('Active Member')
  })

  it('keeps Superuser personal reservations dependent on an active Board Member record', async () => {
    const actor = await createMember('Director')
    vi.stubEnv('PORTAL_SUPERUSER_EMAIL', actor.email)
    const context = await getRoomBBookingContext({
      actorEmail: actor.email,
      now,
    })
    expect(context.defaultOwner).toEqual(personal(actor))
    expect(
      context.owners.find(
        (option) =>
          option.owner.kind === 'boardMember' &&
          option.owner.memberId === actor.id,
      ),
    ).toMatchObject({ unlimited: true })
    await reserve(actor, personal(actor), '2030-01-07', 8, 22)
  })

  it.each([
    'deactivateMember',
    'revokeBoard',
    'deactivateAdministrator',
    'revokeAdministratorBoard',
  ] as const)(
    'releases future personal hours on %s and preserves past and club-owned reservations',
    async (operation) => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(now)
      const actor = await createMember('Director')
      const club = await createClub()
      await grantClub(actor.id, club.id)
      if (
        operation === 'deactivateAdministrator' ||
        operation === 'revokeAdministratorBoard'
      ) {
        await getDb().insert(administrators).values({ memberId: actor.id })
      }
      const [future] = await reserve(actor, personal(actor), '2030-01-08', 8)
      const [clubBooking] = await reserve(
        actor,
        { kind: 'club', clubId: club.id },
        '2030-01-09',
        8,
      )
      const [past] = await getDb()
        .insert(roomBBookings)
        .values({
          date: '2020-01-01',
          startHour: 8,
          memberId: actor.id,
          bookedByMemberId: actor.id,
          bookedByEmail: actor.email,
          ownerLabel: actor.displayName,
        })
        .returning()
      const input = { actorEmail: 'admin@example.com', memberId: actor.id }
      if (operation === 'deactivateMember') await deactivateMember(input)
      if (operation === 'revokeBoard') await revokeBoardAuthority(input)
      if (operation === 'deactivateAdministrator')
        await deactivateAdministrator(input)
      if (operation === 'revokeAdministratorBoard')
        await revokeBoardPositionFromAdministrator(input)
      const rows = await getDb().select().from(roomBBookings)
      expect(rows.find((row) => row.id === future.id)).toMatchObject({
        cancelledAt: now,
        cancelledByEmail: input.actorEmail,
      })
      expect(rows.find((row) => row.id === past.id)?.cancelledAt).toBeNull()
      expect(
        rows.find((row) => row.id === clubBooking.id)?.cancelledAt,
      ).toBeNull()
    },
  )

  it('releases future club hours on archival without removing historical reservations', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    const club = await createClub()
    const actor = await createMember('Director')
    await grantClub(actor.id, club.id)
    const [future] = await reserve(
      actor,
      { kind: 'club', clubId: club.id },
      '2030-01-08',
      8,
    )
    const [past] = await getDb()
      .insert(roomBBookings)
      .values({
        date: '2020-01-01',
        startHour: 8,
        clubId: club.id,
        bookedByMemberId: actor.id,
        bookedByEmail: actor.email,
        ownerLabel: club.shortName,
      })
      .returning()
    await archiveClub({ actorEmail: 'admin@example.com', clubId: club.id })
    const rows = await getDb().select().from(roomBBookings)
    expect(rows.find((row) => row.id === future.id)?.cancelledAt).toEqual(now)
    expect(rows.find((row) => row.id === past.id)?.cancelledAt).toBeNull()
  })

  it('shares club quotas across representatives, keeps personal usage separate, and restores cancelled hours', async () => {
    const club = await createClub()
    const alice = await createMember('Director')
    const bob = await createMember()
    await grantClub(alice.id, club.id)
    await grantClub(bob.id, club.id)
    const owner: RoomBOwner = { kind: 'club', clubId: club.id }
    const created = await reserve(alice, owner, '2030-01-07', 8, 10)
    await expect(reserve(bob, owner, '2030-01-07', 10)).rejects.toThrow(
      '2 hours per day',
    )
    await reserve(bob, owner, '2030-01-08', 8, 10)
    await reserve(alice, owner, '2030-01-09', 8, 10)
    await expect(reserve(bob, owner, '2030-01-10', 8)).rejects.toThrow(
      '6 hours per week',
    )
    await reserve(alice, personal(alice), '2030-01-10', 8, 10)
    const context = await getRoomBBookingContext({ actorEmail: bob.email, now })
    expect(context.owners).toHaveLength(1)
    expect(context.owners[0]).toMatchObject({
      weeklyHoursUsed: 6,
      weeklyHoursRemaining: 0,
    })
    expect(context.cancellableBookings).toHaveLength(6)
    await cancelRoomBBooking({
      actorEmail: bob.email,
      bookingId: created[0].id,
      now,
    })
    await reserve(bob, owner, '2030-01-07', 8)
    const [cancelled] = await getDb()
      .select()
      .from(roomBBookings)
      .where(eq(roomBBookings.id, created[0].id))
    expect(cancelled.cancelledAt).toEqual(now)
    expect(cancelled.cancelledByEmail).toBe(bob.email)
    const refreshed = await getRoomBBookingContext({
      actorEmail: bob.email,
      now,
      week: '2030-01-14',
    })
    expect(refreshed.owners[0]).toMatchObject({
      weeklyHoursUsed: 0,
      weeklyHoursRemaining: 6,
    })
    await reserve(bob, owner, '2030-01-18', 20, 22)
  })

  it('enforces daily and weekly board-member limits and owner authorization', async () => {
    const actor = await createMember('Director')
    const other = await createMember('Director')
    const club = await createClub()
    await reserve(actor, personal(actor), '2030-01-07', 8, 10)
    await expect(
      reserve(actor, personal(actor), '2030-01-07', 10),
    ).rejects.toThrow('2 hours per day')
    await reserve(actor, personal(actor), '2030-01-08', 8, 10)
    await reserve(actor, personal(actor), '2030-01-09', 8, 10)
    await expect(
      reserve(actor, personal(actor), '2030-01-10', 8),
    ).rejects.toThrow('6 hours per week')
    await expect(
      reserve(actor, personal(other), '2030-01-10', 8),
    ).rejects.toThrow('Access denied')
    await expect(
      reserve(actor, { kind: 'club', clubId: club.id }, '2030-01-10', 8),
    ).rejects.toThrow('Club Access')
    const noBoard = await createMember()
    await grantClub(noBoard.id, club.id)
    await expect(
      reserve(noBoard, personal(noBoard), '2030-01-10', 8),
    ).rejects.toThrow('Board Member')
    await expect(
      createRoomBBooking({
        actorEmail: 'missing@example.com',
        owner: personal(actor),
        date: '2030-01-10',
        startHour: 8,
        endHour: 9,
        now,
      }),
    ).rejects.toThrow('Active Member')
    await getDb().insert(administrators).values({ memberId: other.id })
    await reserve(other, personal(actor), '2030-01-14', 8)
    await getDb()
      .update(members)
      .set({ lifecycle: 'deactivated' })
      .where(eq(members.id, actor.id))
    await expect(
      reserve(actor, personal(actor), '2030-01-14', 8),
    ).rejects.toThrow('Active Member')
  })

  it('gives Administrator owners unlimited hours without bypassing conflicts or dates, and rechecks revocation', async () => {
    const administrator = await createMember('Director')
    const other = await createMember('Treasurer')
    await getDb()
      .insert(administrators)
      .values([{ memberId: administrator.id }, { memberId: other.id }])
    await reserve(administrator, personal(administrator), '2030-01-07', 8, 22)
    await reserve(other, personal(other), '2030-01-08', 8, 22)
    const context = await getRoomBBookingContext({
      actorEmail: administrator.email,
      now,
    })
    expect(context.isAdministrator).toBe(true)
    expect(context.defaultOwner).toEqual(personal(administrator))
    expect(
      context.owners.find(
        (option) =>
          option.owner.kind === 'boardMember' &&
          option.owner.memberId === administrator.id,
      ),
    ).toMatchObject({ unlimited: true, weeklyHoursRemaining: null })
    await expect(
      reserve(administrator, personal(administrator), '2030-01-08', 8),
    ).rejects.toThrow('already booked')
    await expect(
      reserve(administrator, personal(administrator), '2030-01-21', 8),
    ).rejects.toThrow('current or next')
    await expect(
      reserve(administrator, personal(administrator), '2030-01-12', 8),
    ).rejects.toThrow('weekdays only')
    await expect(
      reserve(administrator, personal(administrator), '2030-01-07', 7),
    ).rejects.toThrow()
    await expect(
      reserve(administrator, personal(administrator), '2030-01-09', 21, 23),
    ).rejects.toThrow()
    await getDb()
      .delete(administrators)
      .where(eq(administrators.memberId, administrator.id))
    await expect(
      reserve(administrator, personal(administrator), '2030-01-09', 8),
    ).rejects.toThrow('6 hours per week')
    expect(
      (await getRoomBBookingContext({ actorEmail: administrator.email, now }))
        .isAdministrator,
    ).toBe(false)
  })

  it.each(['Manager', 'President', 'Tech Manager', 'Vice President'])(
    'does not grant Room B exceptions through the %s title',
    async (position) => {
      const actor = await createMember(position)
      const other = await createMember('Director')
      const club = await createClub()
      const context = await getRoomBBookingContext({
        actorEmail: actor.email,
        now,
      })
      expect(context.isAdministrator).toBe(false)
      expect(context.owners).toHaveLength(1)
      expect(context.owners[0]).toMatchObject({
        unlimited: false,
        weeklyHoursRemaining: 6,
      })
      await expect(
        reserve(actor, personal(actor), '2030-01-07', 8, 11),
      ).rejects.toThrow('2 hours per day')
      await expect(
        reserve(actor, personal(other), '2030-01-07', 8),
      ).rejects.toThrow('Access denied')
      await expect(
        reserve(actor, { kind: 'club', clubId: club.id }, '2030-01-07', 8),
      ).rejects.toThrow('Club Access')
    },
  )

  it('lets an Administrator without Board authority book for all active owners, applies target quotas, and audits on-behalf actions', async () => {
    const administrator = await createMember()
    await getDb().insert(administrators).values({ memberId: administrator.id })
    const other = await createMember('Director')
    const president = await createMember('President')
    const club = await createClub()
    const inactiveClub = await createClub()
    await getDb()
      .update(clubs)
      .set({ lifecycle: 'archived' })
      .where(eq(clubs.id, inactiveClub.id))
    const inactive = await createMember('Director')
    await getDb()
      .update(members)
      .set({ lifecycle: 'deactivated' })
      .where(eq(members.id, inactive.id))
    const context = await getRoomBBookingContext({
      actorEmail: administrator.email,
      now,
    })
    expect(context.isAdministrator).toBe(true)
    expect(
      context.owners.some(
        (option) =>
          option.owner.kind === 'club' && option.owner.clubId === club.id,
      ),
    ).toBe(true)
    expect(
      context.owners.some(
        (option) =>
          option.owner.kind === 'club' &&
          option.owner.clubId === inactiveClub.id,
      ),
    ).toBe(false)
    expect(
      context.owners.some(
        (option) =>
          option.owner.kind === 'boardMember' &&
          option.owner.memberId === inactive.id,
      ),
    ).toBe(false)
    expect(
      context.owners.filter((option) => option.owner.kind === 'boardMember'),
    ).toHaveLength(2)
    await expect(
      reserve(administrator, personal(administrator), '2030-01-07', 8),
    ).rejects.toThrow('Active Board Member')
    const [booking] = await reserve(
      administrator,
      personal(other),
      '2030-01-07',
      8,
    )
    await expect(
      reserve(administrator, personal(other), '2030-01-07', 9, 11),
    ).rejects.toThrow('2 hours per day')
    await expect(
      reserve(
        administrator,
        { kind: 'club', clubId: club.id },
        '2030-01-08',
        8,
        11,
      ),
    ).rejects.toThrow('2 hours per day')
    await expect(
      reserve(
        administrator,
        { kind: 'club', clubId: inactiveClub.id },
        '2030-01-08',
        8,
      ),
    ).rejects.toThrow('active Club')
    await expect(
      reserve(administrator, personal(inactive), '2030-01-08', 8),
    ).rejects.toThrow('Active Board Member')
    await expect(
      reserve(president, personal(other), '2030-01-08', 8),
    ).rejects.toThrow('Access denied')
    await cancelRoomBBooking({
      actorEmail: administrator.email,
      bookingId: booking.id,
      now,
    })
    const audit = await getDb()
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, booking.id))
    expect(audit.map((entry) => entry.action)).toEqual([
      'room_b_booking.created_for_owner',
      'room_b_booking.cancelled_for_owner',
    ])
    expect(
      audit.every((entry) => entry.actorEmail === administrator.email),
    ).toBe(true)
    const [onBehalf] = await reserve(
      administrator,
      personal(other),
      '2030-01-09',
      8,
    )
    await getDb()
      .delete(administrators)
      .where(eq(administrators.memberId, administrator.id))
    await expect(
      cancelRoomBBooking({
        actorEmail: administrator.email,
        bookingId: onBehalf.id,
        now,
      }),
    ).rejects.toThrow('Access denied')
    await expect(
      reserve(administrator, personal(other), '2030-01-10', 8),
    ).rejects.toThrow('Access denied')
  })

  it('protects cancellation using current grants and prevents cancelling started reservations', async () => {
    const alice = await createMember('Director')
    const bob = await createMember('Director')
    const administrator = await createMember('Director')
    await getDb().insert(administrators).values({ memberId: administrator.id })
    const [booking] = await reserve(alice, personal(alice), '2030-01-07', 8)
    await expect(
      cancelRoomBBooking({ actorEmail: bob.email, bookingId: booking.id, now }),
    ).rejects.toThrow('Access denied')
    expect(
      (await getRoomBBookingContext({ actorEmail: administrator.email, now }))
        .cancellableBookings,
    ).toContainEqual({ id: booking.id, date: booking.date, startHour: 8 })
    await expect(
      cancelRoomBBooking({
        actorEmail: alice.email,
        bookingId: booking.id,
        now: new Date('2030-01-07T13:00:00Z'),
      }),
    ).rejects.toThrow('already started')
    await cancelRoomBBooking({
      actorEmail: administrator.email,
      bookingId: booking.id,
      now,
    })
    await expect(
      cancelRoomBBooking({
        actorEmail: alice.email,
        bookingId: booking.id,
        now,
      }),
    ).rejects.toThrow('not found')
    const club = await createClub()
    await grantClub(alice.id, club.id)
    await grantClub(bob.id, club.id)
    const [clubBooking] = await reserve(
      alice,
      { kind: 'club', clubId: club.id },
      '2030-01-08',
      8,
    )
    await getDb().delete(clubAccess).where(eq(clubAccess.memberId, bob.id))
    await expect(
      cancelRoomBBooking({
        actorEmail: bob.email,
        bookingId: clubBooking.id,
        now,
      }),
    ).rejects.toThrow('Access denied')
  })

  it('reads month schedules and closed dates without extending booking authority', async () => {
    const actor = await createMember('Director')
    await reserve(actor, personal(actor), '2030-01-07', 8, 10)
    const month = await getRoomBSchedule({
      date: '2030-01-07',
      view: 'month',
      now,
    })
    expect(
      month.days
        .find((day) => day.date === '2030-01-07')
        ?.slots.filter((slot) => slot.booking),
    ).toHaveLength(2)
    expect(
      (await getRoomBSchedule({ date: '2030-01-12', view: 'day', now })).days[0]
        .slots,
    ).toEqual([])
    expect(
      (
        await getRoomBSchedule({ date: '2040-01-02', view: 'day', now })
      ).days[0].slots.every((slot) => slot.booking === null),
    ).toBe(true)
    await expect(
      reserve(actor, personal(actor), '2040-01-02', 8),
    ).rejects.toThrow('current or next')
    expect(await getDb().select().from(roomBBookings)).toHaveLength(2)
  })

  it('projects a public display with merged hours and the next reservation on a later day', async () => {
    const actor = await createMember('Director')
    const [first] = await reserve(actor, personal(actor), '2030-01-07', 8, 10)
    await reserve(actor, personal(actor), '2030-01-08', 8)
    const snapshot = await getRoomBDisplaySchedule(
      new Date('2030-01-07T16:00:00Z'),
    )
    expect(snapshot.reservations).toHaveLength(1)
    expect(snapshot.reservations[0]).toMatchObject({
      startHour: 8,
      endHour: 10,
      ownerLabel: actor.displayName,
    })
    expect(snapshot.nextReservation?.date).toBe('2030-01-08')
    for (const value of [
      actor.email,
      actor.id,
      first.id,
      'memberId',
      'bookedByEmail',
    ])
      expect(JSON.stringify(snapshot)).not.toContain(value)
    await cancelRoomBBooking({
      actorEmail: actor.email,
      bookingId: first.id,
      now,
    })
    expect((await getRoomBDisplaySchedule(now)).reservations[0].startHour).toBe(
      9,
    )
  })

  it('returns a weekday calendar with 14 hours and no private attribution', async () => {
    const actor = await createMember('Director')
    const [booking] = await reserve(actor, personal(actor), '2030-01-11', 21)
    const calendar = await getRoomBCalendar({ now })
    expect(calendar.days).toHaveLength(5)
    expect(calendar.days.every((day) => day.slots.length === 14)).toBe(true)
    expect(calendar.days[4].slots[13]).toMatchObject({
      startHour: 21,
      endHour: 22,
      booking: { ownerLabel: actor.displayName, boardPosition: 'Director' },
    })
    const serialized = JSON.stringify(calendar)
    for (const privateValue of [
      actor.email,
      actor.id,
      booking.id,
      'bookedByMemberId',
      'cancelledByEmail',
    ])
      expect(serialized).not.toContain(privateValue)
    await cancelRoomBBooking({
      actorEmail: actor.email,
      bookingId: booking.id,
      now,
    })
    expect(
      (await getRoomBCalendar({ now })).days[4].slots[13].booking,
    ).toBeNull()
    await expect(getRoomBCalendar({ week: '2030-02-30', now })).rejects.toThrow(
      'valid date',
    )
  })

  it('serializes competing owners and rolls back an entire multi-hour request if any hour is taken', async () => {
    const alice = await createMember('Director')
    const bob = await createMember('Director')
    const results = await Promise.allSettled([
      reserve(alice, personal(alice), '2030-01-07', 9),
      reserve(bob, personal(bob), '2030-01-07', 9),
    ])
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1)
    await expect(
      reserve(alice, personal(alice), '2030-01-07', 8, 10),
    ).rejects.toThrow('already booked')
    const rows = await getDb()
      .select()
      .from(roomBBookings)
      .where(isNull(roomBBookings.cancelledAt))
    expect(rows).toHaveLength(1)
    expect(rows[0].startHour).toBe(9)
  })

  it('prevents concurrent representatives exceeding shared daily and weekly quotas', async () => {
    const club = await createClub()
    const alice = await createMember()
    const bob = await createMember()
    await grantClub(alice.id, club.id)
    await grantClub(bob.id, club.id)
    const owner: RoomBOwner = { kind: 'club', clubId: club.id }
    const dayResults = await Promise.allSettled(
      [8, 9, 10].map((hour, index) =>
        reserve(index % 2 ? alice : bob, owner, '2030-01-07', hour),
      ),
    )
    expect(
      dayResults.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(2)
    await reserve(alice, owner, '2030-01-08', 8, 10)
    await reserve(alice, owner, '2030-01-09', 8)
    const weekResults = await Promise.allSettled([
      reserve(alice, owner, '2030-01-10', 8),
      reserve(bob, owner, '2030-01-11', 8),
    ])
    expect(
      weekResults.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1)
    const rows = await getDb()
      .select()
      .from(roomBBookings)
      .where(
        and(
          eq(roomBBookings.clubId, club.id),
          isNull(roomBBookings.cancelledAt),
        ),
      )
    expect(rows).toHaveLength(6)
  })

  it('enforces ownership, hours, attribution, foreign keys and exclusive active hours in PostgreSQL', async () => {
    const actor = await createMember('Director')
    const club = await createClub()
    const base = {
      date: '2030-01-07',
      startHour: 8,
      memberId: actor.id,
      bookedByMemberId: actor.id,
      bookedByEmail: actor.email,
      ownerLabel: actor.displayName,
    }
    const db = getDb()
    await expect(
      db.insert(roomBBookings).values({ ...base, memberId: null }),
    ).rejects.toThrow()
    await expect(
      db.insert(roomBBookings).values({ ...base, clubId: club.id }),
    ).rejects.toThrow()
    await expect(
      db.insert(roomBBookings).values({ ...base, startHour: 22 }),
    ).rejects.toThrow()
    await expect(
      db.insert(roomBBookings).values({ ...base, startHour: 7 }),
    ).rejects.toThrow()
    await expect(
      db.insert(roomBBookings).values({ ...base, bookedByEmail: '' }),
    ).rejects.toThrow()
    await expect(
      db
        .insert(roomBBookings)
        .values({ ...base, bookedByEmail: ' NOT-NORMALIZED@example.com ' }),
    ).rejects.toThrow()
    await expect(
      db.insert(roomBBookings).values({ ...base, cancelledAt: now }),
    ).rejects.toThrow()
    await expect(
      db
        .insert(roomBBookings)
        .values({ ...base, bookedByMemberId: crypto.randomUUID() }),
    ).rejects.toThrow()
    await db.insert(roomBBookings).values(base)
    await expect(
      db
        .insert(roomBBookings)
        .values({ ...base, memberId: null, clubId: club.id }),
    ).rejects.toThrow()
    await db
      .update(roomBBookings)
      .set({ cancelledAt: now, cancelledByEmail: actor.email })
    await db.insert(roomBBookings).values(base)
    expect(await db.select().from(roomBBookings)).toHaveLength(2)
  })
})

async function createMember(position?: string) {
  const [member] = await getDb()
    .insert(members)
    .values({
      displayName: 'Room B Member',
      email: `room-b-${crypto.randomUUID()}@example.com`,
    })
    .returning()
  if (position)
    await getDb()
      .insert(boardMembers)
      .values({ memberId: member.id, boardPosition: position })
  return member
}

async function createClub() {
  const [club] = await getDb()
    .insert(clubs)
    .values({
      shortName: `Club-${crypto.randomUUID()}`,
      fullName: 'Room B Club',
    })
    .returning()
  return club
}

async function grantClub(memberId: string, clubId: string) {
  await getDb().insert(clubAccess).values({ memberId, clubId })
}

function personal(member: { id: string }): RoomBOwner {
  return { kind: 'boardMember', memberId: member.id }
}

function reserve(
  actor: { email: string },
  owner: RoomBOwner,
  date: string,
  startHour: number,
  endHour = startHour + 1,
) {
  return createRoomBBooking({
    actorEmail: actor.email,
    owner,
    date,
    startHour,
    endHour,
    now,
  })
}
