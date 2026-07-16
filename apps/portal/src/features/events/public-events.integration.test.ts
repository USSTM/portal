import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import publicEvents from '../../../server/public-events.js'
import { getDb } from '../../db/index.js'
import { clubs, eventOrganizers, events } from '../../db/schema.js'
import { listPublicEvents } from './public-events.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('public Events API', () => {
  it('publishes ordered overlap-filtered Event data without personal attribution', async () => {
    const db = getDb()
    const suffix = crypto.randomUUID()
    const [owner, organizer] = await db
      .insert(clubs)
      .values([
        {
          fullName: `Public Owner ${suffix}`,
          shortName: `public-owner-${suffix}`,
        },
        {
          fullName: `Public Organizer ${suffix}`,
          shortName: `public-organizer-${suffix}`,
        },
      ])
      .returning()
    const [overlappingEarlier, overlapping, endsAtFrom, startsAtTo] = await db
      .insert(events)
      .values([
        eventInput(
          owner.id,
          'Earlier Overlapping Event',
          '2040-01-01T10:00:00Z',
          '2040-01-01T12:30:00Z',
        ),
        eventInput(
          owner.id,
          'Overlapping Event',
          '2040-01-01T11:00:00Z',
          '2040-01-01T13:00:00Z',
        ),
        eventInput(
          owner.id,
          'Ends At From',
          '2040-01-01T09:00:00Z',
          '2040-01-01T12:00:00Z',
        ),
        eventInput(
          owner.id,
          'Starts At To',
          '2040-01-01T14:00:00Z',
          '2040-01-01T16:00:00Z',
        ),
      ])
      .returning()
    await db.insert(eventOrganizers).values({
      clubId: organizer.id,
      eventId: overlapping.id,
    })
    const allEvents = await listPublicEvents()
    expect(allEvents.events.map((event) => event.id)).toEqual(
      expect.arrayContaining([
        overlappingEarlier.id,
        overlapping.id,
        endsAtFrom.id,
        startsAtTo.id,
      ]),
    )

    const response = await publicEvents(
      new Request(
        'https://portal.example/api/v1/events?from=2040-01-01T12:00:00Z&to=2040-01-01T14:00:00Z',
      ),
    )
    const body = (await response.json()) as {
      events: Array<Record<string, unknown>>
    }

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
    expect(body.events.map((event) => event.id)).toEqual([
      overlappingEarlier.id,
      overlapping.id,
    ])
    expect(body.events).toEqual([
      expect.objectContaining({ id: overlappingEarlier.id }),
      expect.objectContaining({
        endAt: '2040-01-01T13:00:00.000+00:00',
        id: overlapping.id,
        organizingClubs: [
          {
            fullName: organizer.fullName,
            id: organizer.id,
            shortName: organizer.shortName,
          },
        ],
        owningClub: {
          fullName: owner.fullName,
          id: owner.id,
          shortName: owner.shortName,
        },
        startAt: '2040-01-01T11:00:00.000+00:00',
      }),
    ])
    expect(body.events[0]).not.toHaveProperty('creatorMemberId')
    expect(body.events[0]).not.toHaveProperty('lastEditorMemberId')

    const head = await publicEvents(
      new Request('https://portal.example/api/v1/events', { method: 'HEAD' }),
    )
    expect(head.status).toBe(200)
    expect(head.headers.get('Cache-Control')).toBe('public, max-age=60')
    expect(await head.text()).toBe('')
    const invalidRange = await publicEvents(
      new Request(
        'https://portal.example/api/v1/events?from=2040-01-01T14:00:00Z&to=2040-01-01T12:00:00Z',
      ),
    )
    expect(invalidRange.status).toBe(400)
    await expect(invalidRange.json()).resolves.toEqual({
      error: {
        code: 'invalid_date_range',
        message: 'from must be earlier than to',
      },
    })
    const invalidTimestamp = await publicEvents(
      new Request('https://portal.example/api/v1/events?from=not-a-timestamp'),
    )
    expect(invalidTimestamp.status).toBe(400)
    await expect(invalidTimestamp.json()).resolves.toEqual({
      error: {
        code: 'invalid_date_range',
        message: 'from must be a valid RFC 3339 timestamp',
      },
    })
    const method = await publicEvents(
      new Request('https://portal.example/api/v1/events', { method: 'POST' }),
    )
    expect(method.status).toBe(405)
    expect(method.headers.get('Allow')).toBe('GET, HEAD')

    await db.delete(events).where(eq(events.id, endsAtFrom.id))
    await db.delete(events).where(eq(events.id, startsAtTo.id))
  })
})

function eventInput(
  owningClubId: string,
  title: string,
  startAt: string,
  endAt: string,
) {
  return {
    address: '40 Gould Street, Toronto',
    description: 'A public Event used to verify the stable external API.',
    endAt: new Date(endAt),
    location: 'Student Centre',
    owningClubId,
    startAt: new Date(startAt),
    title,
  }
}
