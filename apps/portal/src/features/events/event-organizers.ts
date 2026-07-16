import { and, eq, inArray } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import {
  auditEntries,
  clubAccess,
  clubs,
  eventOrganizers,
  events,
  members,
} from '../../db/schema.js'

export function normalizeOrganizingClubIds(
  owningClubId: string,
  clubIds: string[],
) {
  return [...new Set(clubIds)].filter((clubId) => clubId !== owningClubId)
}

export async function replaceEventOrganizers(input: {
  actorEmail: string
  eventId: string
  organizerClubIds: string[]
  privileged?: boolean
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const currentEvents = await tx
      .select({ endAt: events.endAt, owningClubId: events.owningClubId })
      .from(events)
      .where(eq(events.id, input.eventId))
      .for('update')
    const current = currentEvents.at(0)
    if (
      current === undefined ||
      (!input.privileged && current.endAt <= new Date())
    )
      throw new Error('Event organizers can no longer be changed')
    if (!input.privileged) {
      const authorities = await tx
        .select({ memberId: members.id })
        .from(members)
        .innerJoin(clubAccess, eq(clubAccess.memberId, members.id))
        .innerJoin(clubs, eq(clubs.id, clubAccess.clubId))
        .where(
          and(
            eq(members.email, input.actorEmail),
            eq(members.lifecycle, 'active'),
            eq(clubAccess.clubId, current.owningClubId),
            eq(clubs.lifecycle, 'active'),
          ),
        )
      if (authorities.at(0) === undefined) throw new Error('Access denied')
    }

    const organizerClubIds = normalizeOrganizingClubIds(
      current.owningClubId,
      input.organizerClubIds,
    )
    const existingArchivedOrganizers = await tx
      .select({ clubId: eventOrganizers.clubId })
      .from(eventOrganizers)
      .innerJoin(clubs, eq(clubs.id, eventOrganizers.clubId))
      .where(
        and(
          eq(eventOrganizers.eventId, input.eventId),
          eq(clubs.lifecycle, 'archived'),
        ),
      )
    if (organizerClubIds.length > 0) {
      const activeClubs = await tx
        .select({ id: clubs.id })
        .from(clubs)
        .where(
          and(
            inArray(clubs.id, organizerClubIds),
            eq(clubs.lifecycle, 'active'),
          ),
        )
      if (activeClubs.length !== organizerClubIds.length) {
        throw new Error('Organizing Clubs must be active')
      }
    }
    const retainedOrganizerClubIds = [
      ...new Set([
        ...organizerClubIds,
        ...existingArchivedOrganizers.map((organizer) => organizer.clubId),
      ]),
    ]
    await tx
      .delete(eventOrganizers)
      .where(eq(eventOrganizers.eventId, input.eventId))
    if (retainedOrganizerClubIds.length > 0) {
      await tx.insert(eventOrganizers).values(
        retainedOrganizerClubIds.map((clubId) => ({
          clubId,
          eventId: input.eventId,
        })),
      )
    }
    if (input.privileged)
      await tx.insert(auditEntries).values({
        action: 'event.organizers_changed',
        actorEmail: input.actorEmail,
        changedValues: { organizerClubIds: retainedOrganizerClubIds },
        targetId: input.eventId,
        targetType: 'event',
      })
  })
}
