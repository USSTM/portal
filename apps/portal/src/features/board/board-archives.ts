import { asc, desc, eq, inArray } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import {
  auditEntries,
  boardArchiveEntries,
  boardArchives,
} from '../../db/schema.js'

import { listPublicBoard } from './public-board.js'

// A Board Archive freezes a past board for an academic year: display names and
// Board Positions only, never Member references or photos. There is at most one
// per academic year, and the database rejects any later edit or delete
// (migration 0020). There is no re-import; an existing year is left as it is.

export type BoardArchiveEntry = { displayName: string; boardPosition: string }

export class BoardArchiveExistsError extends Error {
  constructor(academicYear: string) {
    super(`A Board Archive for ${academicYear} already exists`)
    this.name = 'BoardArchiveExistsError'
  }
}

/**
 * Accepts `2025-2026`, `2025/2026`, `2025-26` or `2025/26` and returns
 * `2025-2026`, or undefined when the years are not consecutive.
 */
export function normalizeAcademicYear(value: string) {
  const match = value.trim().match(/^(\d{4})\s*[-/–]\s*(\d{2}|\d{4})$/)
  if (!match) return undefined
  const start = Number(match[1])
  const end = Number(match[2])
  // A two-digit end year names the last two digits of the next year.
  const consecutive =
    match[2].length === 2 ? (start + 1) % 100 === end : end === start + 1
  return consecutive ? `${start}-${start + 1}` : undefined
}

/** Archives the current board, in its public order, for an academic year. */
export async function createBoardArchive(input: {
  academicYear: string
  actorEmail: string
}) {
  const academicYear = requireAcademicYear(input.academicYear)
  const entries = (await listPublicBoard()).boardMembers.map(
    ({ boardPosition, displayName }) => ({ boardPosition, displayName }),
  )
  if (entries.length === 0) {
    throw new Error('There are no current Board Members to archive')
  }
  return insertBoardArchive({
    academicYear,
    action: 'board_archive.created',
    actorEmail: input.actorEmail,
    entries,
    source: 'portal',
  })
}

/** Stores a past board from the Website's BoardHistory (legacy import). */
export async function importBoardArchive(input: {
  academicYear: string
  actorEmail: string
  entries: BoardArchiveEntry[]
}) {
  return insertBoardArchive({
    academicYear: requireAcademicYear(input.academicYear),
    action: 'board_archive.imported',
    actorEmail: input.actorEmail,
    entries: input.entries,
    source: 'legacy_import',
  })
}

export async function listBoardArchiveYears() {
  const rows = await getDb()
    .select({ academicYear: boardArchives.academicYear })
    .from(boardArchives)
  return new Set(rows.map((row) => row.academicYear))
}

/** Board Archives for `GET /api/v1/board-archives`, newest first. */
export async function listPublicBoardArchives() {
  const db = getDb()
  const archives = await db
    .select({ academicYear: boardArchives.academicYear, id: boardArchives.id })
    .from(boardArchives)
    .orderBy(desc(boardArchives.academicYear))
  const entries = archives.length
    ? await db
        .select({
          archiveId: boardArchiveEntries.archiveId,
          boardPosition: boardArchiveEntries.boardPosition,
          displayName: boardArchiveEntries.displayName,
        })
        .from(boardArchiveEntries)
        .where(
          inArray(
            boardArchiveEntries.archiveId,
            archives.map((archive) => archive.id),
          ),
        )
        .orderBy(asc(boardArchiveEntries.position))
    : []
  return {
    boardArchives: archives.map((archive) => ({
      academicYear: archive.academicYear,
      boardMembers: entries
        .filter((entry) => entry.archiveId === archive.id)
        .map(({ boardPosition, displayName }) => ({
          boardPosition,
          displayName,
        })),
    })),
  }
}

export function requireBoardArchiveAuthority(identity: PortalIdentity) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Access denied')
}

function requireAcademicYear(value: string) {
  const academicYear = normalizeAcademicYear(value)
  if (!academicYear) {
    throw new Error('Use an academic year such as 2025-2026')
  }
  return academicYear
}

async function insertBoardArchive(input: {
  academicYear: string
  action: string
  actorEmail: string
  entries: BoardArchiveEntry[]
  source: 'portal' | 'legacy_import'
}) {
  const entries = input.entries.map((entry) => ({
    boardPosition: entry.boardPosition.trim(),
    displayName: entry.displayName.trim(),
  }))
  if (entries.length === 0) throw new Error('A Board Archive needs members')
  if (entries.some((entry) => !entry.boardPosition || !entry.displayName)) {
    throw new Error('Every archived member needs a name and Board Position')
  }

  const db = getDb()
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: boardArchives.id })
      .from(boardArchives)
      .where(eq(boardArchives.academicYear, input.academicYear))
    if (existing.length > 0)
      throw new BoardArchiveExistsError(input.academicYear)

    const [archive] = await tx
      .insert(boardArchives)
      .values({ academicYear: input.academicYear, source: input.source })
      .returning()
    await tx.insert(boardArchiveEntries).values(
      entries.map((entry, position) => ({
        ...entry,
        archiveId: archive.id,
        position,
      })),
    )
    await tx.insert(auditEntries).values({
      action: input.action,
      actorEmail: input.actorEmail.trim().toLowerCase(),
      changedValues: { academicYear: archive.academicYear, entries },
      targetId: archive.id,
      targetType: 'board_archive',
    })
    return { academicYear: archive.academicYear, entries: entries.length }
  })
}
