import { describe, expect, it } from 'vitest'

import { loadLegacyExport, prepareLegacyImport } from './import.js'

const fixtureDirectory = new URL('./fixtures/representative/', import.meta.url)

describe('legacy Club and Event import preparation', () => {
  it('maps legacy rows while preserving IDs, public fields, and timestamp instants', async () => {
    const source = await loadLegacyExport(fixtureDirectory)
    const prepared = prepareLegacyImport(source)

    expect(prepared.clubs[0]).toMatchObject({
      contactEmail: 'alpha@example.com',
      fullName: 'Alpha Science Society',
      id: '10000000-0000-4000-8000-000000000001',
      lifecycle: 'active',
      shortName: 'Alpha',
    })
    expect(prepared.events[0]).toMatchObject({
      creatorMemberId: null,
      id: '20000000-0000-4000-8000-000000000001',
      owningClubId: '10000000-0000-4000-8000-000000000001',
    })
    expect(prepared.events[0]?.startAt.toISOString()).toBe(
      '2025-01-15T23:00:00.000Z',
    )
    expect(prepared.events[1]?.endAt.toISOString()).toBe(
      '2030-09-16T00:00:00.000Z',
    )
  })

  it('removes owner and duplicate organizer rows and reports every conversion', async () => {
    const prepared = prepareLegacyImport(
      await loadLegacyExport(fixtureDirectory),
    )

    expect(prepared.organizers).toEqual([
      {
        clubId: '10000000-0000-4000-8000-000000000002',
        eventId: '20000000-0000-4000-8000-000000000002',
      },
      {
        clubId: '10000000-0000-4000-8000-000000000003',
        eventId: '20000000-0000-4000-8000-000000000002',
      },
    ])
    expect(prepared.report).toMatchObject({
      duplicateOrganizersRemoved: 1,
      ownerOrganizersRemoved: 2,
      source: { clubs: 3, events: 2, organizers: 5 },
      validated: { clubs: 3, events: 2, organizers: 2, timestamps: 4 },
    })
    expect(prepared.report.verification.identifiers).toEqual({
      clubIds: prepared.clubs.map((club) => club.id),
      eventIds: prepared.events.map((event) => event.id),
    })
    expect(prepared.report.verification.relationships).toEqual(
      prepared.organizers,
    )
    expect(prepared.report.verification.timestamps[0]).toEqual({
      endAt: '2025-01-16T01:00:00.000Z',
      endSource: '2025-01-15 20:00:00-05',
      eventId: '20000000-0000-4000-8000-000000000001',
      startAt: '2025-01-15T23:00:00.000Z',
      startSource: '2025-01-15 18:00:00-05',
    })
    expect(prepared.report.verification.invalidReferences).toEqual([])
  })

  it('rejects invalid timestamps and references before import', async () => {
    const source = await loadLegacyExport(fixtureDirectory)
    source.events[0] = {
      ...source.events[0],
      created_by: '10000000-0000-4000-8000-000000000099',
      start_time: 'not-a-timestamp',
    }

    expect(() => prepareLegacyImport(source)).toThrow(
      /missing Owning Club.*invalid timestamp/s,
    )
  })

  it('rejects timestamps without explicit timezone information', async () => {
    const source = await loadLegacyExport(fixtureDirectory)
    source.events[0] = {
      ...source.events[0],
      start_time: '2025-01-15T18:00:00',
    }

    expect(() => prepareLegacyImport(source)).toThrow(
      'invalid timestamp 2025-01-15T18:00:00',
    )
  })
})
