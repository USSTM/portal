import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { inArray } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '../../db/index.js'
import { clubs, eventOrganizers, events } from '../../db/schema.js'

const legacyUserSchema = z.object({
  email: z.email(),
  group_name: z.string(),
  id: z.uuid(),
  username: z.string(),
})

const legacyEventSchema = z.object({
  address: z.string(),
  created_by: z.uuid(),
  description: z.string(),
  end_time: z.string(),
  id: z.uuid(),
  location: z.string(),
  start_time: z.string(),
  title: z.string(),
})

const legacyOrganizerSchema = z.object({
  event_id: z.uuid(),
  group_id: z.uuid(),
})

const legacyExportSchema = z.object({
  events: z.array(legacyEventSchema),
  organizers: z.array(legacyOrganizerSchema),
  users: z.array(legacyUserSchema),
})

export type LegacyExport = z.infer<typeof legacyExportSchema>

type PreparedClub = typeof clubs.$inferInsert
type PreparedEvent = typeof events.$inferInsert
type PreparedOrganizer = typeof eventOrganizers.$inferInsert

export interface PreparationReport {
  duplicateOrganizersRemoved: number
  ownerOrganizersRemoved: number
  source: { clubs: number; events: number; organizers: number }
  validated: {
    clubs: number
    events: number
    organizers: number
    timestamps: number
  }
  verification: {
    identifiers: { clubIds: string[]; eventIds: string[] }
    invalidReferences: string[]
    relationships: PreparedOrganizer[]
    timestamps: Array<{
      endAt: string
      endSource: string
      eventId: string
      startAt: string
      startSource: string
    }>
  }
}

export interface PreparedLegacyImport {
  clubs: PreparedClub[]
  events: PreparedEvent[]
  organizers: PreparedOrganizer[]
  report: PreparationReport
}

export interface ImportReport extends PreparationReport {
  database: {
    existing: { clubs: number; events: number; organizers: number }
    inserted: { clubs: number; events: number; organizers: number }
  }
}

export class LegacyImportValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Legacy import validation failed:\n- ${issues.join('\n- ')}`)
    this.name = 'LegacyImportValidationError'
  }
}

export async function loadLegacyExport(
  directory: string | URL,
): Promise<LegacyExport> {
  const [users, eventsSource, organizers] = await Promise.all([
    readJson(directory, 'users.json'),
    readJson(directory, 'events.json'),
    readJson(directory, 'organizers.json'),
  ])

  return legacyExportSchema.parse({
    events: eventsSource,
    organizers,
    users,
  })
}

export function prepareLegacyImport(
  source: LegacyExport,
): PreparedLegacyImport {
  const parsed = legacyExportSchema.parse(source)
  const errors: string[] = []
  const clubIds = new Set<string>()
  const shortNames = new Set<string>()

  for (const club of parsed.users) {
    if (clubIds.has(club.id)) errors.push(`Club ${club.id}: duplicate ID`)
    clubIds.add(club.id)
    if (shortNames.has(club.username)) {
      errors.push(`Club ${club.id}: duplicate short name ${club.username}`)
    }
    shortNames.add(club.username)
    validateNonblank(errors, `Club ${club.id} short name`, club.username, true)
    validateNonblank(errors, `Club ${club.id} full name`, club.group_name)
  }

  const eventIds = new Set<string>()
  const parsedTimes = new Map<string, { endAt: Date; startAt: Date }>()
  for (const event of parsed.events) {
    if (eventIds.has(event.id)) errors.push(`Event ${event.id}: duplicate ID`)
    eventIds.add(event.id)
    if (!clubIds.has(event.created_by)) {
      errors.push(`Event ${event.id}: missing Owning Club ${event.created_by}`)
    }
    validateNonblank(errors, `Event ${event.id} title`, event.title)
    validateNonblank(errors, `Event ${event.id} description`, event.description)
    validateNonblank(errors, `Event ${event.id} location`, event.location)
    validateNonblank(errors, `Event ${event.id} address`, event.address)

    const startAt = parseLegacyTimestamp(event.start_time)
    const endAt = parseLegacyTimestamp(event.end_time)
    if (!startAt) {
      errors.push(`Event ${event.id}: invalid timestamp ${event.start_time}`)
    }
    if (!endAt) {
      errors.push(`Event ${event.id}: invalid timestamp ${event.end_time}`)
    }
    if (startAt && endAt) {
      if (endAt.getTime() - startAt.getTime() < 60 * 60 * 1000) {
        errors.push(
          `Event ${event.id}: end must be at least one hour after start`,
        )
      }
      parsedTimes.set(event.id, { endAt, startAt })
    }
  }

  for (const organizer of parsed.organizers) {
    if (!eventIds.has(organizer.event_id)) {
      errors.push(
        `Organizer ${organizer.event_id}/${organizer.group_id}: missing Event`,
      )
    }
    if (!clubIds.has(organizer.group_id)) {
      errors.push(
        `Organizer ${organizer.event_id}/${organizer.group_id}: missing Club`,
      )
    }
  }

  if (errors.length > 0) {
    throw new LegacyImportValidationError(errors)
  }

  const preparedClubs: PreparedClub[] = parsed.users.map((club) => ({
    contactEmail: club.email,
    fullName: club.group_name,
    id: club.id,
    lifecycle: 'active',
    shortName: club.username,
  }))
  const preparedEvents: PreparedEvent[] = parsed.events.map((event) => {
    const timestamps = parsedTimes.get(event.id)
    if (!timestamps)
      throw new Error(`Missing validated timestamps for ${event.id}`)
    return {
      address: event.address,
      creatorMemberId: null,
      description: event.description,
      endAt: timestamps.endAt,
      id: event.id,
      lastEditorMemberId: null,
      location: event.location,
      owningClubId: event.created_by,
      startAt: timestamps.startAt,
      title: event.title,
    }
  })

  const ownerByEvent = new Map(
    preparedEvents.map((event) => [event.id, event.owningClubId]),
  )
  const seenOrganizers = new Set<string>()
  const preparedOrganizers: PreparedOrganizer[] = []
  let duplicateOrganizersRemoved = 0
  let ownerOrganizersRemoved = 0
  for (const organizer of parsed.organizers) {
    if (ownerByEvent.get(organizer.event_id) === organizer.group_id) {
      ownerOrganizersRemoved += 1
      continue
    }
    const key = `${organizer.event_id}/${organizer.group_id}`
    if (seenOrganizers.has(key)) {
      duplicateOrganizersRemoved += 1
      continue
    }
    seenOrganizers.add(key)
    preparedOrganizers.push({
      clubId: organizer.group_id,
      eventId: organizer.event_id,
    })
  }

  return {
    clubs: preparedClubs,
    events: preparedEvents,
    organizers: preparedOrganizers,
    report: {
      duplicateOrganizersRemoved,
      ownerOrganizersRemoved,
      source: {
        clubs: parsed.users.length,
        events: parsed.events.length,
        organizers: parsed.organizers.length,
      },
      validated: {
        clubs: preparedClubs.length,
        events: preparedEvents.length,
        organizers: preparedOrganizers.length,
        timestamps: preparedEvents.length * 2,
      },
      verification: {
        identifiers: {
          clubIds: preparedClubs.map((club) => club.id),
          eventIds: preparedEvents.map((event) => event.id),
        },
        invalidReferences: [],
        relationships: preparedOrganizers,
        timestamps: parsed.events.map((event) => {
          const timestamps = parsedTimes.get(event.id)
          if (!timestamps)
            throw new Error(`Missing validated timestamps for ${event.id}`)
          return {
            endAt: timestamps.endAt.toISOString(),
            endSource: event.end_time,
            eventId: event.id,
            startAt: timestamps.startAt.toISOString(),
            startSource: event.start_time,
          }
        }),
      },
    },
  }
}

export async function importLegacyExport(
  source: LegacyExport,
): Promise<ImportReport> {
  const prepared = prepareLegacyImport(source)
  const db = getDb()

  const database = await db.transaction(async (tx) => {
    const insertedClubs = prepared.clubs.length
      ? await tx
          .insert(clubs)
          .values(prepared.clubs)
          .onConflictDoNothing()
          .returning({ id: clubs.id })
      : []
    const storedClubs = prepared.clubs.length
      ? await tx
          .select()
          .from(clubs)
          .where(
            inArray(
              clubs.id,
              prepared.clubs.map((club) => club.id),
            ),
          )
      : []
    verifyClubs(prepared.clubs, storedClubs)

    const insertedEvents = prepared.events.length
      ? await tx
          .insert(events)
          .values(prepared.events)
          .onConflictDoNothing()
          .returning({ id: events.id })
      : []
    const storedEvents = prepared.events.length
      ? await tx
          .select()
          .from(events)
          .where(
            inArray(
              events.id,
              prepared.events.map((event) => event.id),
            ),
          )
      : []
    verifyEvents(prepared.events, storedEvents)

    const insertedOrganizers = prepared.organizers.length
      ? await tx
          .insert(eventOrganizers)
          .values(prepared.organizers)
          .onConflictDoNothing()
          .returning({
            clubId: eventOrganizers.clubId,
            eventId: eventOrganizers.eventId,
          })
      : []
    const storedOrganizers = prepared.events.length
      ? await tx
          .select()
          .from(eventOrganizers)
          .where(
            inArray(
              eventOrganizers.eventId,
              prepared.events.map((event) => event.id),
            ),
          )
      : []
    verifyOrganizers(prepared.organizers, storedOrganizers)

    return {
      existing: {
        clubs: prepared.clubs.length - insertedClubs.length,
        events: prepared.events.length - insertedEvents.length,
        organizers: prepared.organizers.length - insertedOrganizers.length,
      },
      inserted: {
        clubs: insertedClubs.length,
        events: insertedEvents.length,
        organizers: insertedOrganizers.length,
      },
    }
  })

  return { ...prepared.report, database }
}

async function readJson(
  directory: string | URL,
  filename: string,
): Promise<unknown> {
  const path =
    directory instanceof URL
      ? new URL(filename, directory)
      : resolve(directory, filename)
  return JSON.parse(await readFile(path, 'utf8')) as unknown
}

function parseLegacyTimestamp(value: string): Date | undefined {
  const postgresTimestamp = value.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2})(?::?(\d{2}))?$/,
  )
  const isoTimestamp =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
  if (!postgresTimestamp && !isoTimestamp.test(value)) return undefined
  const normalized = postgresTimestamp
    ? `${postgresTimestamp[1]}T${postgresTimestamp[2]}${postgresTimestamp[3]}:${postgresTimestamp[4] || '00'}`
    : value
  const timestamp = new Date(normalized)
  return Number.isNaN(timestamp.getTime()) ? undefined : timestamp
}

function validateNonblank(
  errors: string[],
  field: string,
  value: string,
  trimmed = false,
) {
  if (value.trim().length === 0) errors.push(`${field}: must not be blank`)
  if (trimmed && value !== value.trim())
    errors.push(`${field}: must be trimmed`)
}

function verifyClubs(
  expected: PreparedClub[],
  actual: Array<typeof clubs.$inferSelect>,
) {
  const actualById = new Map(actual.map((club) => [club.id, club]))
  for (const club of expected) {
    const stored = actualById.get(club.id)
    if (
      !stored ||
      stored.shortName !== club.shortName ||
      stored.fullName !== club.fullName ||
      stored.contactEmail !== club.contactEmail ||
      stored.lifecycle !== 'active'
    ) {
      throw new Error(`Existing Club ${club.id} conflicts with legacy export`)
    }
  }
}

function verifyEvents(
  expected: PreparedEvent[],
  actual: Array<typeof events.$inferSelect>,
) {
  const actualById = new Map(actual.map((event) => [event.id, event]))
  for (const event of expected) {
    const stored = actualById.get(event.id)
    if (
      !stored ||
      stored.title !== event.title ||
      stored.description !== event.description ||
      stored.location !== event.location ||
      stored.address !== event.address ||
      stored.startAt.getTime() !== event.startAt.getTime() ||
      stored.endAt.getTime() !== event.endAt.getTime() ||
      stored.owningClubId !== event.owningClubId ||
      stored.creatorMemberId !== null ||
      stored.lastEditorMemberId !== null
    ) {
      throw new Error(`Existing Event ${event.id} conflicts with legacy export`)
    }
  }
}

function verifyOrganizers(
  expected: PreparedOrganizer[],
  actual: Array<typeof eventOrganizers.$inferSelect>,
) {
  if (actual.length !== expected.length) {
    throw new Error(
      'Existing Event organizer relationships conflict with legacy export',
    )
  }
  const actualKeys = new Set(
    actual.map((row) => `${row.eventId}/${row.clubId}`),
  )
  for (const organizer of expected) {
    if (!actualKeys.has(`${organizer.eventId}/${organizer.clubId}`)) {
      throw new Error(
        `Existing Event organizer relationships conflict with legacy export: missing Organizing Club ${organizer.clubId} for Event ${organizer.eventId}`,
      )
    }
  }
}
