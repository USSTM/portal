import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import {
  auditEntries,
  boardMembers,
  bookings,
  members,
  shiftSlots,
} from '../../db/schema.js'
import {
  revokeBoardAuthority,
  updateBoardMember,
} from '../admin/board-members.js'
import { deactivateMember } from '../admin/members.js'
import {
  cancelOwnBooking,
  cancelOverrideBooking,
  createOverrideBooking,
  createOwnBooking,
} from './bookings'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip
const now = new Date('2030-01-07T14:00:00Z')

describeWithDatabase('Board Member Bookings', () => {
  it('enforces authority, eligibility, weekly limits, duplicate prevention, and cancellation', async () => {
    const { actor, slots } = await createBoardMember()
    const other = await createBoardMember()
    const created = await createOwnBooking({
      actorEmail: actor.email,
      date: '2030-01-07',
      now,
      shiftSlotId: slots[0].id,
    })
    await expect(
      createOwnBooking({
        actorEmail: actor.email,
        date: '2030-01-07',
        now,
        shiftSlotId: slots[0].id,
      }),
    ).rejects.toThrow('already booked')
    await expect(
      createOwnBooking({
        actorEmail: 'unknown@example.com',
        date: '2030-01-07',
        now,
        shiftSlotId: slots[1].id,
      }),
    ).rejects.toThrow('Board Member authority')
    await createOwnBooking({
      actorEmail: other.actor.email,
      date: '2030-01-07',
      now,
      shiftSlotId: slots[0].id,
    })
    for (const [date, slot] of [
      ['2030-01-07', slots[1]],
      ['2030-01-07', slots[2]],
      ['2030-01-07', slots[3]],
      ['2030-01-08', slots[0]],
    ] as const) {
      await createOwnBooking({
        actorEmail: actor.email,
        date,
        now,
        shiftSlotId: slot.id,
      })
    }
    await expect(
      createOwnBooking({
        actorEmail: actor.email,
        date: '2030-01-08',
        now,
        shiftSlotId: slots[1].id,
      }),
    ).rejects.toThrow('at most five')
    await expect(
      createOwnBooking({
        actorEmail: actor.email,
        date: '2030-01-21',
        now,
        shiftSlotId: slots[0].id,
      }),
    ).rejects.toThrow('current or next')
    await cancelOwnBooking({
      actorEmail: actor.email,
      bookingId: created.id,
      now,
    })
    await expect(
      cancelOwnBooking({
        actorEmail: other.actor.email,
        bookingId: created.id,
        now,
      }),
    ).rejects.toThrow('Booking not found')
  })

  it('serializes concurrent requests so a Board Member cannot exceed five weekly Bookings', async () => {
    const { actor, slots } = await createBoardMember()
    const attempts = [
      ['2030-01-07', slots[0]],
      ['2030-01-07', slots[1]],
      ['2030-01-07', slots[2]],
      ['2030-01-07', slots[3]],
      ['2030-01-08', slots[0]],
      ['2030-01-08', slots[1]],
    ].map(([date, slot]) =>
      createOwnBooking({
        actorEmail: actor.email,
        date: date as string,
        now,
        shiftSlotId: (slot as (typeof slots)[number]).id,
      }),
    )
    const results = await Promise.allSettled(attempts)
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(5)
  })

  it('does not allow cancellation after a Shift has started', async () => {
    const { actor, slots } = await createBoardMember()
    const booking = await createOwnBooking({
      actorEmail: actor.email,
      date: '2030-01-07',
      now,
      shiftSlotId: slots[0].id,
    })
    await expect(
      cancelOwnBooking({
        actorEmail: actor.email,
        bookingId: booking.id,
        now: new Date('2030-01-07T15:00:00Z'),
      }),
    ).rejects.toThrow('already started')
  })

  it('allows privileged future overrides beyond normal limits and audits them', async () => {
    const { actor, slots } = await createBoardMember()
    const booking = await createOverrideBooking({
      actorEmail: 'admin@example.com',
      date: '2040-01-02',
      memberId: actor.id,
      now,
      shiftSlotId: slots[0].id,
    })
    await cancelOverrideBooking({
      actorEmail: 'admin@example.com',
      bookingId: booking.id,
      now,
    })
    const audit = await getDb()
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, booking.id))
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        'booking.override_created',
        'booking.override_cancelled',
      ]),
    )
  })

  it('updates only future snapshots and removes future Bookings on grant revocation or deactivation', async () => {
    const { actor, slots } = await createBoardMember()
    const db = getDb()
    const [past, future] = await db
      .insert(bookings)
      .values([
        {
          boardPosition: 'Treasurer',
          date: '2020-01-06',
          displayName: 'Booking Board Member',
          memberId: actor.id,
          shiftSlotId: slots[0].id,
        },
        {
          boardPosition: 'Treasurer',
          date: '2030-01-07',
          displayName: 'Booking Board Member',
          memberId: actor.id,
          shiftSlotId: slots[1].id,
        },
      ])
      .returning()
    await updateBoardMember({
      actorEmail: 'admin@example.com',
      boardPosition: 'President',
      displayName: 'Updated Board Member',
      memberId: actor.id,
    })
    const snapshots = await db
      .select()
      .from(bookings)
      .where(eq(bookings.memberId, actor.id))
    expect(snapshots.find((booking) => booking.id === past.id)).toMatchObject({
      boardPosition: 'Treasurer',
      displayName: 'Booking Board Member',
    })
    expect(snapshots.find((booking) => booking.id === future.id)).toMatchObject(
      {
        boardPosition: 'President',
        displayName: 'Updated Board Member',
      },
    )
    await revokeBoardAuthority({
      actorEmail: 'admin@example.com',
      memberId: actor.id,
    })
    expect(
      await db.select().from(bookings).where(eq(bookings.id, future.id)),
    ).toHaveLength(0)
    expect(
      await db.select().from(bookings).where(eq(bookings.id, past.id)),
    ).toHaveLength(1)

    const another = await createBoardMember()
    const futureBooking = await createOverrideBooking({
      actorEmail: 'admin@example.com',
      date: '2030-01-08',
      memberId: another.actor.id,
      now,
      shiftSlotId: another.slots[0].id,
    })
    await deactivateMember({
      actorEmail: 'admin@example.com',
      memberId: another.actor.id,
    })
    expect(
      await db.select().from(bookings).where(eq(bookings.id, futureBooking.id)),
    ).toHaveLength(0)
  })
})

async function createBoardMember() {
  const db = getDb()
  const suffix = crypto.randomUUID()
  const [actor] = await db
    .insert(members)
    .values({
      displayName: 'Booking Board Member',
      email: `booking-${suffix}@example.com`,
    })
    .returning()
  await db
    .insert(boardMembers)
    .values({ boardPosition: 'Treasurer', memberId: actor.id })
  const slots = await db.select().from(shiftSlots).orderBy(shiftSlots.startTime)
  return { actor, slots }
}
