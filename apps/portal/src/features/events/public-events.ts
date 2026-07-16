import { and, asc, eq, gt, inArray, lt } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import { clubs, eventOrganizers, events } from '../../db/schema.js'

export type PublicEventsRange = { from?: Date; to?: Date }

export async function listPublicEvents(range: PublicEventsRange = {}) {
  const db = getDb()
  const where = and(
    range.from ? gt(events.endAt, range.from) : undefined,
    range.to ? lt(events.startAt, range.to) : undefined,
  )
  const entries = await db
    .select({
      address: events.address,
      description: events.description,
      endAt: events.endAt,
      id: events.id,
      location: events.location,
      owningClubFullName: clubs.fullName,
      owningClubId: clubs.id,
      owningClubShortName: clubs.shortName,
      startAt: events.startAt,
      title: events.title,
    })
    .from(events)
    .innerJoin(clubs, eq(clubs.id, events.owningClubId))
    .where(where)
    .orderBy(asc(events.startAt), asc(events.id))

  const organizerRows = entries.length
    ? await db
        .select({
          eventId: eventOrganizers.eventId,
          fullName: clubs.fullName,
          id: clubs.id,
          shortName: clubs.shortName,
        })
        .from(eventOrganizers)
        .innerJoin(clubs, eq(clubs.id, eventOrganizers.clubId))
        .where(
          inArray(
            eventOrganizers.eventId,
            entries.map((entry) => entry.id),
          ),
        )
        .orderBy(asc(clubs.fullName), asc(clubs.id))
    : []

  return {
    events: entries.map((entry) => ({
      address: entry.address,
      description: entry.description,
      endAt: asRfc3339(entry.endAt),
      id: entry.id,
      location: entry.location,
      organizingClubs: organizerRows
        .filter((organizer) => organizer.eventId === entry.id)
        .map(({ fullName, id, shortName }) => ({ fullName, id, shortName })),
      owningClub: {
        fullName: entry.owningClubFullName,
        id: entry.owningClubId,
        shortName: entry.owningClubShortName,
      },
      startAt: asRfc3339(entry.startAt),
      title: entry.title,
    })),
  }
}

function asRfc3339(value: Date) {
  return value.toISOString().replace('Z', '+00:00')
}
