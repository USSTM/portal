import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { boardMembers, members, shiftSlots } from '../../db/schema.js'
import { cancelOwnBooking, createOwnBooking } from './bookings'

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
