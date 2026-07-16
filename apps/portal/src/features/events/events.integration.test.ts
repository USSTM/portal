import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import {
  auditEntries,
  clubAccess,
  clubs,
  eventOrganizers,
  events,
  members,
} from '../../db/schema.js'

import {
  createEvent,
  deleteEvent,
  editEvent,
  listEvents,
  overrideCreateEvent,
  overrideDeleteEvent,
  overrideEditEvent,
} from './events'
import { replaceEventOrganizers } from './event-organizers'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Club Events', () => {
  it('creates an Event only for an active Club the Member can access', async () => {
    const { club, member } = await createAuthorizedMember()
    const db = getDb()
    const event = await createEvent({
      ...eventInput(club.id),
      actorEmail: member.email,
    })

    expect(event.owningClubId).toBe(club.id)
    expect(event.creatorMemberId).toBe(member.id)
    await expect(
      createEvent({
        ...eventInput(crypto.randomUUID()),
        actorEmail: member.email,
      }),
    ).rejects.toThrow('Access denied')

    await db
      .update(clubs)
      .set({ lifecycle: 'archived' })
      .where(eq(clubs.id, club.id))
    await expect(
      createEvent({ ...eventInput(club.id), actorEmail: member.email }),
    ).rejects.toThrow('Access denied')
  })

  it('searches accessible Events and paginates upcoming results', async () => {
    const { club, member } = await createAuthorizedMember()
    const db = getDb()
    await db.insert(events).values(
      Array.from({ length: 21 }, (_, index) => ({
        ...eventInput(club.id),
        description: `A detailed searchable event description number ${index}.`,
        endAt: new Date(
          `2030-01-${String(index + 1).padStart(2, '0')}T16:00:00Z`,
        ),
        startAt: new Date(
          `2030-01-${String(index + 1).padStart(2, '0')}T14:00:00Z`,
        ),
        title: `Searchable Event ${index}`,
      })),
    )

    const firstPage = await listEvents({
      actorEmail: member.email,
      now: new Date('2029-01-01T00:00:00Z'),
      page: 1,
      search: club.shortName,
      view: 'upcoming',
    })
    const secondPage = await listEvents({
      actorEmail: member.email,
      now: new Date('2029-01-01T00:00:00Z'),
      page: 2,
      search: club.shortName,
      view: 'upcoming',
    })

    expect(firstPage.entries).toHaveLength(20)
    expect(secondPage.entries).toHaveLength(1)
    expect(firstPage.total).toBe(21)
  })

  it('includes ongoing Events in upcoming and orders past Events by end descending', async () => {
    const { club, member } = await createAuthorizedMember()
    const db = getDb()
    await db.insert(events).values([
      {
        ...eventInput(club.id),
        endAt: new Date('2030-01-03T12:00:00Z'),
        startAt: new Date('2030-01-03T10:00:00Z'),
        title: 'Future Event',
      },
      {
        ...eventInput(club.id),
        endAt: new Date('2030-01-01T13:00:00Z'),
        startAt: new Date('2030-01-01T11:00:00Z'),
        title: 'Ongoing Event',
      },
      {
        ...eventInput(club.id),
        endAt: new Date('2029-12-31T12:00:00Z'),
        startAt: new Date('2029-12-31T10:00:00Z'),
        title: 'Older Event',
      },
      {
        ...eventInput(club.id),
        endAt: new Date('2030-01-01T11:00:00Z'),
        startAt: new Date('2030-01-01T09:00:00Z'),
        title: 'Latest Past Event',
      },
    ])

    const now = new Date('2030-01-01T12:00:00Z')
    const upcoming = await listEvents({
      actorEmail: member.email,
      now,
      page: 1,
      view: 'upcoming',
    })
    const past = await listEvents({
      actorEmail: member.email,
      now,
      page: 1,
      view: 'past',
    })

    expect(upcoming.entries.map((event) => event.title)).toEqual([
      'Ongoing Event',
      'Future Event',
    ])
    expect(past.entries.map((event) => event.title)).toEqual([
      'Latest Past Event',
      'Older Event',
    ])
  })

  it('enforces owner authority, lifecycle boundaries, and stale-write conflicts', async () => {
    const { club, member } = await createAuthorizedMember()
    const created = await createEvent({
      ...eventInput(club.id),
      actorEmail: member.email,
    })

    const updated = await editEvent({
      ...eventInput(club.id),
      actorEmail: member.email,
      eventId: created.id,
      title: 'Updated Event',
      updatedAt: created.updatedAt,
    })
    const db = getDb()
    const [unauthorizedMember] = await db
      .insert(members)
      .values({
        displayName: 'Unauthorized Event Member',
        email: `unauthorized-${crypto.randomUUID()}@example.com`,
      })
      .returning()
    await expect(
      editEvent({
        ...eventInput(club.id),
        actorEmail: unauthorizedMember.email,
        eventId: created.id,
        updatedAt: updated.updatedAt,
      }),
    ).rejects.toThrow('Access denied')
    await expect(
      editEvent({
        ...eventInput(club.id),
        actorEmail: member.email,
        eventId: created.id,
        title: 'Stale Event',
        updatedAt: created.updatedAt,
      }),
    ).rejects.toThrow('Reload it before saving')
    await expect(
      deleteEvent({
        actorEmail: member.email,
        confirmed: false,
        eventId: created.id,
      }),
    ).rejects.toThrow('confirmation')
    await deleteEvent({
      actorEmail: member.email,
      confirmed: true,
      eventId: created.id,
    })

    const [completed] = await db
      .insert(events)
      .values({
        ...eventInput(club.id),
        endAt: new Date('2029-01-01T12:00:00Z'),
        startAt: new Date('2029-01-01T10:00:00Z'),
      })
      .returning()
    await expect(
      editEvent({
        ...eventInput(club.id),
        actorEmail: member.email,
        eventId: completed.id,
        updatedAt: completed.updatedAt,
      }),
    ).rejects.toThrow('no longer editable')
    await expect(
      deleteEvent({
        actorEmail: member.email,
        confirmed: true,
        eventId: completed.id,
      }),
    ).rejects.toThrow('no longer be deleted')
    expect(updated.lastEditorMemberId).toBe(member.id)
  })

  it('keeps Organizing Clubs distinct, retained after archive, and owner-managed', async () => {
    const { club: owner, member: ownerMember } = await createAuthorizedMember()
    const db = getDb()
    const event = await createEvent({
      ...eventInput(owner.id),
      actorEmail: ownerMember.email,
    })
    const [organizer] = await db
      .insert(clubs)
      .values({
        fullName: `Organizer ${crypto.randomUUID()}`,
        shortName: `organizer-${crypto.randomUUID()}`,
      })
      .returning()
    const [organizerMember] = await db
      .insert(members)
      .values({
        displayName: 'Organizer Member',
        email: `organizer-${crypto.randomUUID()}@example.com`,
      })
      .returning()
    await db
      .insert(clubAccess)
      .values({ clubId: organizer.id, memberId: organizerMember.id })

    await replaceEventOrganizers({
      actorEmail: ownerMember.email,
      eventId: event.id,
      organizerClubIds: [organizer.id, owner.id, organizer.id],
    })
    const organizers = await db
      .select()
      .from(eventOrganizers)
      .where(eq(eventOrganizers.eventId, event.id))
    expect(organizers).toEqual([{ eventId: event.id, clubId: organizer.id }])
    const organizerView = await listEvents({
      actorEmail: organizerMember.email,
      now: new Date('2029-01-01T00:00:00Z'),
      page: 1,
      view: 'upcoming',
    })
    expect(organizerView.entries.map((entry) => entry.id)).toContain(event.id)
    expect(
      organizerView.entries.find((entry) => entry.id === event.id)?.canManage,
    ).toBe(false)
    await expect(
      replaceEventOrganizers({
        actorEmail: organizerMember.email,
        eventId: event.id,
        organizerClubIds: [],
      }),
    ).rejects.toThrow('Access denied')

    await db
      .update(clubs)
      .set({ lifecycle: 'archived' })
      .where(eq(clubs.id, organizer.id))
    const retained = await db
      .select()
      .from(eventOrganizers)
      .where(eq(eventOrganizers.eventId, event.id))
    expect(retained).toEqual([{ eventId: event.id, clubId: organizer.id }])
    await replaceEventOrganizers({
      actorEmail: ownerMember.email,
      eventId: event.id,
      organizerClubIds: [],
    })
    const retainedAfterSave = await db
      .select()
      .from(eventOrganizers)
      .where(eq(eventOrganizers.eventId, event.id))
    expect(retainedAfterSave).toEqual([
      { eventId: event.id, clubId: organizer.id },
    ])
  })

  it('lets privileged actors manage every active Club, correct completed Events, and audits only overrides', async () => {
    const { club: firstClub, member: actor } = await createAuthorizedMember()
    const db = getDb()
    const [secondClub] = await db
      .insert(clubs)
      .values({
        fullName: `Transferred Club ${crypto.randomUUID()}`,
        shortName: `transferred-${crypto.randomUUID()}`,
      })
      .returning()
    const ordinary = await createEvent({
      ...eventInput(firstClub.id),
      actorEmail: actor.email,
    })
    expect(
      await db
        .select()
        .from(auditEntries)
        .where(eq(auditEntries.targetId, ordinary.id)),
    ).toHaveLength(0)
    const created = await overrideCreateEvent({
      ...eventInput(firstClub.id),
      actorEmail: actor.email,
    })
    await db.insert(eventOrganizers).values({
      clubId: secondClub.id,
      eventId: created.id,
    })
    const transferred = await overrideEditEvent({
      ...eventInput(secondClub.id),
      actorEmail: actor.email,
      eventId: created.id,
      updatedAt: created.updatedAt,
    })
    expect(transferred.owningClubId).toBe(secondClub.id)
    expect(transferred.creatorMemberId).toBe(actor.id)
    expect(transferred.lastEditorMemberId).toBe(actor.id)
    expect(
      await db
        .select()
        .from(eventOrganizers)
        .where(eq(eventOrganizers.eventId, created.id)),
    ).toHaveLength(0)
    await replaceEventOrganizers({
      actorEmail: actor.email,
      eventId: created.id,
      organizerClubIds: [firstClub.id],
      privileged: true,
    })

    const [completed] = await db
      .insert(events)
      .values({
        ...eventInput(firstClub.id),
        endAt: new Date('2020-01-01T16:00:00Z'),
        startAt: new Date('2020-01-01T14:00:00Z'),
      })
      .returning()
    const corrected = await overrideEditEvent({
      ...eventInput(firstClub.id),
      actorEmail: actor.email,
      endAt: new Date('2020-01-01T16:00:00Z'),
      eventId: completed.id,
      startAt: new Date('2020-01-01T14:00:00Z'),
      updatedAt: completed.updatedAt,
    })
    expect(corrected.id).toBe(completed.id)
    await expect(
      overrideDeleteEvent({ actorEmail: actor.email, eventId: completed.id }),
    ).rejects.toThrow('no longer be deleted')

    await overrideDeleteEvent({ actorEmail: actor.email, eventId: created.id })
    const audit = await db
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.actorEmail, actor.email))
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        'event.created',
        'event.organizers_changed',
        'event.ownership_transferred',
        'event.updated',
        'event.deleted',
      ]),
    )
  })
})

async function createAuthorizedMember() {
  const db = getDb()
  const suffix = crypto.randomUUID()
  const [club] = await db
    .insert(clubs)
    .values({
      fullName: `Events Club ${suffix}`,
      shortName: `events-${suffix}`,
    })
    .returning()
  const [member] = await db
    .insert(members)
    .values({
      displayName: 'Event Member',
      email: `events-${suffix}@example.com`,
    })
    .returning()
  await db.insert(clubAccess).values({ clubId: club.id, memberId: member.id })
  return { club, member }
}

function eventInput(owningClubId: string) {
  return {
    address: '40 Gould Street, Toronto',
    creatorMemberId: null,
    description: 'A detailed event description for integration testing.',
    endAt: new Date('2030-01-01T16:00:00Z'),
    lastEditorMemberId: null,
    location: 'Student Centre',
    owningClubId,
    startAt: new Date('2030-01-01T14:00:00Z'),
    title: 'Integration Event',
  }
}
