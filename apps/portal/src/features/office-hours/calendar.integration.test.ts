import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { bookings, members, shiftSlots } from '../../db/schema.js'
import { getOfficeHoursCalendar } from './calendar'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('public Office Hours calendar', () => {
  it('uses the four seeded Slots and shows public booking snapshots for any week', async () => {
    const db = getDb()
    const slots = await db
      .select()
      .from(shiftSlots)
      .orderBy(shiftSlots.startTime)
    expect(slots.map((slot) => [slot.startTime, slot.endTime])).toEqual([
      ['10:00:00', '12:00:00'],
      ['12:00:00', '14:00:00'],
      ['14:00:00', '16:00:00'],
      ['16:00:00', '18:00:00'],
    ])
    const [member] = await db
      .insert(members)
      .values({
        displayName: 'Calendar Board Member',
        email: `calendar-${crypto.randomUUID()}@example.com`,
      })
      .returning()
    await db.insert(bookings).values({
      boardPosition: 'President',
      date: '2030-01-07',
      displayName: 'Calendar Board Member',
      memberId: member.id,
      shiftSlotId: slots[0].id,
    })

    const calendar = await getOfficeHoursCalendar({ week: '2030-01-11' })
    expect(calendar.week).toBe('2030-01-07')
    expect(calendar.days).toHaveLength(5)
    expect(calendar.days[0].shifts).toHaveLength(4)
    expect(calendar.days[0].shifts[0].bookings).toEqual([
      { boardPosition: 'President', displayName: 'Calendar Board Member' },
    ])
    expect(calendar.days[1].shifts[0].bookings).toEqual([])
    await db.delete(bookings).where(eq(bookings.memberId, member.id))
  })
})
