import type { SQL } from 'drizzle-orm'
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gt,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { getDb } from '../../db/index.js'
import {
  auditEntries,
  clubAccess,
  clubs,
  eventOrganizers,
  events,
  members,
} from '../../db/schema.js'

const pageSize = 20

export async function createEvent(input: {
  actorEmail: string
  address: string
  description: string
  endAt: Date
  location: string
  owningClubId: string
  startAt: Date
  title: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const activeClub = await tx.execute<{ id: string }>(sql`
      select ${clubs.id} as id
      from ${clubs}
      where ${clubs.id} = ${input.owningClubId}
        and ${clubs.lifecycle} = 'active'
      for update
    `)
    if (activeClub.rows.length === 0) throw new Error('Access denied')
    const authorities = await tx
      .select({ memberId: members.id })
      .from(members)
      .innerJoin(clubAccess, eq(clubAccess.memberId, members.id))
      .innerJoin(clubs, eq(clubs.id, clubAccess.clubId))
      .where(
        and(
          eq(members.email, input.actorEmail),
          eq(members.lifecycle, 'active'),
          eq(clubAccess.clubId, input.owningClubId),
          eq(clubs.lifecycle, 'active'),
        ),
      )

    const authority = authorities.at(0)
    if (authority === undefined) throw new Error('Access denied')

    const [event] = await tx
      .insert(events)
      .values({
        address: input.address.trim(),
        creatorMemberId: authority.memberId,
        description: input.description.trim(),
        endAt: input.endAt,
        lastEditorMemberId: authority.memberId,
        location: input.location.trim(),
        owningClubId: input.owningClubId,
        startAt: input.startAt,
        title: input.title.trim(),
        updatedAt: new Date(),
      })
      .returning()
    return event
  })
}

export async function editEvent(input: {
  actorEmail: string
  address: string
  description: string
  endAt: Date
  eventId: string
  location: string
  startAt: Date
  title: string
  updatedAt: Date
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const currentEvents = await tx
      .select({
        endAt: events.endAt,
        id: events.id,
        owningClubId: events.owningClubId,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .where(eq(events.id, input.eventId))
      .for('update')
    const current = currentEvents.at(0)
    if (current === undefined || current.endAt <= new Date())
      throw new Error('Event is no longer editable')
    if (current.updatedAt.getTime() !== input.updatedAt.getTime()) {
      throw new Error('This Event changed. Reload it before saving.')
    }
    const editors = await tx
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
    const editor = editors.at(0)
    if (editor === undefined) throw new Error('Access denied')

    const [event] = await tx
      .update(events)
      .set({
        address: input.address.trim(),
        description: input.description.trim(),
        endAt: input.endAt,
        lastEditorMemberId: editor.memberId,
        location: input.location.trim(),
        startAt: input.startAt,
        title: input.title.trim(),
        updatedAt: new Date(
          Math.max(Date.now(), current.updatedAt.getTime() + 1),
        ),
      })
      .where(eq(events.id, current.id))
      .returning()
    return event
  })
}

export async function deleteEvent(input: {
  actorEmail: string
  confirmed: boolean
  eventId: string
}) {
  if (!input.confirmed) throw new Error('Event deletion requires confirmation')
  const db = getDb()
  return db.transaction(async (tx) => {
    const currentEvents = await tx
      .select({
        id: events.id,
        owningClubId: events.owningClubId,
        startAt: events.startAt,
      })
      .from(events)
      .where(eq(events.id, input.eventId))
      .for('update')
    const current = currentEvents.at(0)
    if (current === undefined || current.startAt <= new Date())
      throw new Error('Event can no longer be deleted')
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
    const authority = authorities.at(0)
    if (authority === undefined) throw new Error('Access denied')
    await tx.delete(events).where(eq(events.id, current.id))
  })
}

export async function overrideDeleteEvent(input: {
  actorEmail: string
  eventId: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const event = (
      await tx
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .for('update')
    ).at(0)
    if (event === undefined || event.startAt <= new Date())
      throw new Error('Event can no longer be deleted')
    await tx.delete(events).where(eq(events.id, event.id))
    await tx.insert(auditEntries).values({
      action: 'event.deleted',
      actorEmail: input.actorEmail,
      changedValues: {},
      targetId: event.id,
      targetType: 'event',
    })
  })
}

export async function overrideEditEvent(input: {
  actorEmail: string
  address: string
  description: string
  endAt: Date
  eventId: string
  location: string
  owningClubId: string
  startAt: Date
  title: string
  updatedAt: Date
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const current = (
      await tx
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .for('update')
    ).at(0)
    if (current === undefined) throw new Error('Event not found')
    if (current.updatedAt.getTime() !== input.updatedAt.getTime())
      throw new Error('This Event changed. Reload it before saving.')
    const owner = (
      await tx
        .select({ id: clubs.id })
        .from(clubs)
        .where(
          and(eq(clubs.id, input.owningClubId), eq(clubs.lifecycle, 'active')),
        )
    ).at(0)
    if (owner === undefined) throw new Error('Owning Club must be active')
    const editor = await privilegedActorMember(tx, input.actorEmail)
    const [event] = await tx
      .update(events)
      .set({
        address: input.address.trim(),
        description: input.description.trim(),
        endAt: input.endAt,
        lastEditorMemberId: editor?.id ?? null,
        location: input.location.trim(),
        owningClubId: input.owningClubId,
        startAt: input.startAt,
        title: input.title.trim(),
        updatedAt: new Date(
          Math.max(Date.now(), current.updatedAt.getTime() + 1),
        ),
      })
      .where(eq(events.id, current.id))
      .returning()
    await tx
      .delete(eventOrganizers)
      .where(
        and(
          eq(eventOrganizers.eventId, event.id),
          eq(eventOrganizers.clubId, event.owningClubId),
        ),
      )
    await tx.insert(auditEntries).values({
      action:
        current.owningClubId === event.owningClubId
          ? 'event.updated'
          : 'event.ownership_transferred',
      actorEmail: input.actorEmail,
      changedValues: {
        address: event.address,
        description: event.description,
        endAt: event.endAt.toISOString(),
        location: event.location,
        owningClubId: event.owningClubId,
        startAt: event.startAt.toISOString(),
        title: event.title,
      },
      targetId: event.id,
      targetType: 'event',
    })
    return event
  })
}

export async function overrideCreateEvent(input: {
  actorEmail: string
  address: string
  description: string
  endAt: Date
  location: string
  owningClubId: string
  startAt: Date
  title: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const owner = (
      await tx
        .select({ id: clubs.id })
        .from(clubs)
        .where(
          and(eq(clubs.id, input.owningClubId), eq(clubs.lifecycle, 'active')),
        )
    ).at(0)
    if (owner === undefined) throw new Error('Owning Club must be active')
    const creator = await privilegedActorMember(tx, input.actorEmail)
    const [event] = await tx
      .insert(events)
      .values({
        address: input.address.trim(),
        creatorMemberId: creator?.id ?? null,
        description: input.description.trim(),
        endAt: input.endAt,
        location: input.location.trim(),
        lastEditorMemberId: creator?.id ?? null,
        owningClubId: input.owningClubId,
        startAt: input.startAt,
        title: input.title.trim(),
        updatedAt: new Date(),
      })
      .returning()
    await tx.insert(auditEntries).values({
      action: 'event.created',
      actorEmail: input.actorEmail,
      changedValues: {
        address: event.address,
        description: event.description,
        endAt: event.endAt.toISOString(),
        location: event.location,
        owningClubId: event.owningClubId,
        startAt: event.startAt.toISOString(),
        title: event.title,
      },
      targetId: event.id,
      targetType: 'event',
    })
    return event
  })
}

async function privilegedActorMember(
  tx: Parameters<ReturnType<typeof getDb>['transaction']>[0] extends (
    tx: infer Transaction,
  ) => unknown
    ? Transaction
    : never,
  actorEmail: string,
) {
  return (
    await tx
      .select({ id: members.id })
      .from(members)
      .where(eq(members.email, actorEmail.trim().toLowerCase()))
      .limit(1)
  ).at(0)
}

export async function listEvents(input: {
  actorEmail: string
  canViewAll?: boolean
  page: number
  search?: string
  view: 'past' | 'upcoming'
  now?: Date
}) {
  const db = getDb()
  const now = input.now ?? new Date()
  const accessibleClub = input.canViewAll
    ? undefined
    : exists(
        db
          .select({ memberId: clubAccess.memberId })
          .from(clubAccess)
          .innerJoin(members, eq(members.id, clubAccess.memberId))
          .where(
            and(
              eq(clubAccess.clubId, events.owningClubId),
              eq(members.email, input.actorEmail),
              eq(members.lifecycle, 'active'),
            ),
          ),
      )
  const organizerAccess = input.canViewAll
    ? undefined
    : exists(
        db
          .select({ eventId: eventOrganizers.eventId })
          .from(eventOrganizers)
          .innerJoin(clubAccess, eq(clubAccess.clubId, eventOrganizers.clubId))
          .innerJoin(members, eq(members.id, clubAccess.memberId))
          .where(
            and(
              eq(eventOrganizers.eventId, events.id),
              eq(members.email, input.actorEmail),
              eq(members.lifecycle, 'active'),
            ),
          ),
      )
  const creators = alias(members, 'event_creators')
  const editors = alias(members, 'event_editors')
  const ownerAccess: SQL<boolean> | undefined = input.canViewAll
    ? undefined
    : (exists(
        db
          .select({ memberId: clubAccess.memberId })
          .from(clubAccess)
          .innerJoin(members, eq(members.id, clubAccess.memberId))
          .where(
            and(
              eq(clubAccess.clubId, events.owningClubId),
              eq(members.email, input.actorEmail),
              eq(members.lifecycle, 'active'),
            ),
          ),
      ) as SQL<boolean>)
  const search = input.search?.trim()
  const textMatches = search
    ? or(
        ilike(events.title, `%${search}%`),
        ilike(events.description, `%${search}%`),
        ilike(events.location, `%${search}%`),
        ilike(events.address, `%${search}%`),
        ilike(clubs.shortName, `%${search}%`),
        ilike(clubs.fullName, `%${search}%`),
      )
    : undefined
  const where = and(
    input.canViewAll ? undefined : or(accessibleClub, organizerAccess),
    input.view === 'upcoming' ? gt(events.endAt, now) : lte(events.endAt, now),
    textMatches,
  )
  const [{ total }] = await db
    .select({ total: count() })
    .from(events)
    .innerJoin(clubs, eq(clubs.id, events.owningClubId))
    .where(where)
  const entries = await db
    .select({
      address: events.address,
      canManage: input.canViewAll ? sql<boolean>`true` : ownerAccess!,
      creatorDisplayName: creators.displayName,
      description: events.description,
      endAt: events.endAt,
      editorDisplayName: editors.displayName,
      id: events.id,
      location: events.location,
      owningClubId: events.owningClubId,
      owningClubName: clubs.fullName,
      owningClubShortName: clubs.shortName,
      startAt: events.startAt,
      title: events.title,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .innerJoin(clubs, eq(clubs.id, events.owningClubId))
    .leftJoin(creators, eq(creators.id, events.creatorMemberId))
    .leftJoin(editors, eq(editors.id, events.lastEditorMemberId))
    .where(where)
    .orderBy(
      ...(input.view === 'upcoming'
        ? [asc(events.startAt), asc(events.id)]
        : [desc(events.endAt), desc(events.id)]),
    )
    .limit(pageSize)
    .offset((input.page - 1) * pageSize)

  const organizerRows = entries.length
    ? await db
        .select({
          clubId: clubs.id,
          eventId: eventOrganizers.eventId,
          fullName: clubs.fullName,
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
    entries: entries.map((entry) => ({
      ...entry,
      organizingClubs: organizerRows
        .filter((organizer) => organizer.eventId === entry.id)
        .map(({ clubId, fullName, shortName }) => ({
          id: clubId,
          fullName,
          shortName,
        })),
    })),
    page: input.page,
    pageSize,
    total,
  }
}
