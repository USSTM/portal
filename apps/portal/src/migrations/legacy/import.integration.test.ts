import { eq, inArray } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { clubs, eventOrganizers, events } from '../../db/schema.js'
import {
  importLegacyExport,
  loadLegacyExport,
  prepareLegacyImport,
} from './import.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip
const fixtureDirectory = new URL('./fixtures/representative/', import.meta.url)

describeWithDatabase('legacy Club and Event database import', () => {
  it('imports representative rows atomically and reruns without duplicates', async () => {
    const db = getDb()
    const source = await loadLegacyExport(fixtureDirectory)
    const prepared = prepareLegacyImport(source)
    await removeFixtureRows()

    try {
      const first = await importLegacyExport(source)
      const second = await importLegacyExport(source)

      expect(first.database).toEqual({
        existing: { clubs: 0, events: 0, organizers: 0 },
        inserted: { clubs: 3, events: 2, organizers: 2 },
      })
      expect(second.database).toEqual({
        existing: { clubs: 3, events: 2, organizers: 2 },
        inserted: { clubs: 0, events: 0, organizers: 0 },
      })

      const storedClubs = await db
        .select()
        .from(clubs)
        .where(
          inArray(
            clubs.id,
            prepared.clubs.map((club) => club.id),
          ),
        )
      const storedEvents = await db
        .select()
        .from(events)
        .where(
          inArray(
            events.id,
            prepared.events.map((event) => event.id),
          ),
        )
      const storedOrganizers = await db
        .select()
        .from(eventOrganizers)
        .where(
          inArray(
            eventOrganizers.eventId,
            prepared.events.map((event) => event.id),
          ),
        )

      expect(storedClubs).toHaveLength(3)
      expect(storedClubs.every((club) => club.lifecycle === 'active')).toBe(
        true,
      )
      expect(storedEvents).toHaveLength(2)
      expect(storedEvents[0]?.creatorMemberId).toBeNull()
      expect(storedOrganizers).toHaveLength(2)
    } finally {
      await removeFixtureRows()
    }
  })

  it('writes nothing when source validation fails', async () => {
    const db = getDb()
    const source = await loadLegacyExport(fixtureDirectory)
    source.organizers.push({
      event_id: '20000000-0000-4000-8000-000000000099',
      group_id: '10000000-0000-4000-8000-000000000001',
    })
    await removeFixtureRows()

    await expect(importLegacyExport(source)).rejects.toThrow('missing Event')
    const stored = await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.id, '10000000-0000-4000-8000-000000000001'))
    expect(stored).toEqual([])
  })

  it('rolls back new rows when an existing target row conflicts', async () => {
    const db = getDb()
    const source = await loadLegacyExport(fixtureDirectory)
    await removeFixtureRows()
    await db.insert(clubs).values({
      contactEmail: 'different@example.com',
      fullName: 'Conflicting Club',
      id: '10000000-0000-4000-8000-000000000001',
      lifecycle: 'active',
      shortName: 'Conflict',
    })

    try {
      await expect(importLegacyExport(source)).rejects.toThrow(
        'conflicts with legacy export',
      )
      const storedClubs = await db
        .select({ id: clubs.id })
        .from(clubs)
        .where(
          inArray(clubs.id, [
            '10000000-0000-4000-8000-000000000001',
            '10000000-0000-4000-8000-000000000002',
            '10000000-0000-4000-8000-000000000003',
          ]),
        )
      const storedEvents = await db
        .select({ id: events.id })
        .from(events)
        .where(
          inArray(events.id, [
            '20000000-0000-4000-8000-000000000001',
            '20000000-0000-4000-8000-000000000002',
          ]),
        )

      expect(storedClubs).toEqual([
        { id: '10000000-0000-4000-8000-000000000001' },
      ])
      expect(storedEvents).toEqual([])
    } finally {
      await removeFixtureRows()
    }
  })

  it('rejects extra target organizer relationships for imported Events', async () => {
    const db = getDb()
    const source = await loadLegacyExport(fixtureDirectory)
    await removeFixtureRows()

    try {
      await importLegacyExport(source)
      await db.insert(eventOrganizers).values({
        clubId: '10000000-0000-4000-8000-000000000002',
        eventId: '20000000-0000-4000-8000-000000000001',
      })

      await expect(importLegacyExport(source)).rejects.toThrow(
        'organizer relationships conflict with legacy export',
      )
    } finally {
      await removeFixtureRows()
    }
  })
})

async function removeFixtureRows() {
  const db = getDb()
  await db
    .delete(events)
    .where(
      inArray(events.id, [
        '20000000-0000-4000-8000-000000000001',
        '20000000-0000-4000-8000-000000000002',
      ]),
    )
  await db
    .delete(clubs)
    .where(
      inArray(clubs.id, [
        '10000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000003',
      ]),
    )
}
