import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'
import { getDb } from '../../db/index.js'
import { clubAccess, clubs, members } from '../../db/schema.js'

import { eventEditInput, eventInput } from './event-input.js'
import {
  createEvent,
  deleteEvent,
  editEvent,
  listEvents,
  overrideCreateEvent,
  overrideDeleteEvent,
  overrideEditEvent,
} from './events.js'
import { replaceEventOrganizers } from './event-organizers.js'

export const createEventAction = createServerFn({ method: 'POST' })
  .inputValidator(eventInput)
  .handler(async ({ data }) =>
    createEvent({ ...data, actorEmail: await requireEventMember() }),
  )

export const editEventAction = createServerFn({ method: 'POST' })
  .inputValidator(eventEditInput)
  .handler(async ({ data }) =>
    editEvent({ ...data, actorEmail: await requireEventMember() }),
  )

export const deleteEventAction = createServerFn({
  method: 'POST',
})
  .inputValidator(
    z.object({ confirmed: z.literal(true), eventId: z.string().uuid() }),
  )
  .handler(async ({ data }) =>
    deleteEvent({ ...data, actorEmail: await requireEventMember() }),
  )

export const overrideDeleteEventAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ confirmed: z.literal(true), eventId: z.string().uuid() }),
  )
  .handler(async ({ data }) =>
    overrideDeleteEvent({
      ...data,
      actorEmail: await requireEventAdministrator(),
    }),
  )

export const overrideCreateEventAction = createServerFn({ method: 'POST' })
  .inputValidator(eventInput)
  .handler(async ({ data }) =>
    overrideCreateEvent({
      ...data,
      actorEmail: await requireEventAdministrator(),
    }),
  )

export const overrideEditEventAction = createServerFn({ method: 'POST' })
  .inputValidator(
    eventEditInput.and(z.object({ owningClubId: z.string().uuid() })),
  )
  .handler(async ({ data }) =>
    overrideEditEvent({
      ...data,
      actorEmail: await requireEventAdministrator(),
    }),
  )

export const replaceEventOrganizersAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      eventId: z.string().uuid(),
      organizerClubIds: z.array(z.string().uuid()),
    }),
  )
  .handler(async ({ data }) =>
    replaceEventOrganizers({ ...data, actorEmail: await requireEventMember() }),
  )

export const overrideReplaceEventOrganizersAction = createServerFn({
  method: 'POST',
})
  .inputValidator(
    z.object({
      eventId: z.string().uuid(),
      organizerClubIds: z.array(z.string().uuid()),
    }),
  )
  .handler(async ({ data }) =>
    replaceEventOrganizers({
      ...data,
      actorEmail: await requireEventAdministrator(),
      privileged: true,
    }),
  )

export const getOrganizerClubs = createServerFn({ method: 'GET' }).handler(
  async () => {
    const identity = await getPortalIdentity()
    if (identity.kind !== 'administrator' && identity.kind !== 'superuser') {
      await requireEventMember(identity)
    }
    return getDb()
      .select({
        fullName: clubs.fullName,
        id: clubs.id,
        shortName: clubs.shortName,
      })
      .from(clubs)
      .where(eq(clubs.lifecycle, 'active'))
      .orderBy(clubs.fullName)
  },
)

export const getEvents = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      page: z.number().int().positive().default(1),
      search: z.string().trim().max(100).optional(),
      view: z.enum(['past', 'upcoming']).default('upcoming'),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await getPortalIdentity()
    const isPrivileged =
      identity.kind === 'administrator' || identity.kind === 'superuser'
    const actorEmail = isPrivileged
      ? identity.email
      : await requireEventMember(identity)
    const result = await listEvents({
      ...data,
      actorEmail,
      canViewAll: isPrivileged,
    })
    return {
      ...result,
      entries: result.entries.map(
        ({ creatorDisplayName, editorDisplayName, ...event }) =>
          isPrivileged
            ? { ...event, creatorDisplayName, editorDisplayName }
            : {
                ...event,
                creatorDisplayName: undefined,
                editorDisplayName: undefined,
              },
      ),
      isPrivileged,
    }
  })

export const getEventCreationClubs = createServerFn({ method: 'GET' }).handler(
  async () => {
    const identity = await getPortalIdentity()
    const isPrivileged =
      identity.kind === 'administrator' || identity.kind === 'superuser'
    if (isPrivileged) {
      return getDb()
        .select({
          fullName: clubs.fullName,
          id: clubs.id,
          shortName: clubs.shortName,
        })
        .from(clubs)
        .where(eq(clubs.lifecycle, 'active'))
        .orderBy(clubs.fullName)
    }
    const actorEmail = await requireEventMember(identity)
    return getDb()
      .select({
        fullName: clubs.fullName,
        id: clubs.id,
        shortName: clubs.shortName,
      })
      .from(clubAccess)
      .innerJoin(members, eq(members.id, clubAccess.memberId))
      .innerJoin(clubs, eq(clubs.id, clubAccess.clubId))
      .where(
        and(
          eq(members.email, actorEmail),
          eq(members.lifecycle, 'active'),
          eq(clubs.lifecycle, 'active'),
        ),
      )
  },
)

async function requireEventMember(
  identity?: Awaited<ReturnType<typeof getPortalIdentity>>,
) {
  identity ??= await getPortalIdentity()
  if (identity.kind !== 'member') throw new Error('Access denied')
  const activeClubAccess = await getDb()
    .select({ clubId: clubAccess.clubId })
    .from(clubAccess)
    .innerJoin(members, eq(members.id, clubAccess.memberId))
    .innerJoin(clubs, eq(clubs.id, clubAccess.clubId))
    .where(
      and(
        eq(members.email, identity.email),
        eq(members.lifecycle, 'active'),
        eq(clubs.lifecycle, 'active'),
      ),
    )
  if (activeClubAccess.length > 0) return identity.email
  throw new Error('Access denied')
}

async function requireEventAdministrator() {
  const identity = await getPortalIdentity()
  if (identity.kind === 'administrator' || identity.kind === 'superuser')
    return identity.email
  throw new Error('Access denied')
}
