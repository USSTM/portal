import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import {
  auditEntries,
  boardArchiveEntries,
  boardArchives,
  members,
} from '../../db/schema.js'
import { createMemberWithBoardAuthority } from '../admin/board-members.js'
import {
  BoardArchiveExistsError,
  createBoardArchive,
  importBoardArchive,
  listBoardArchiveYears,
  listPublicBoardArchives,
} from './board-archives.js'
import {
  applyBoardHistoryImport,
  planBoardHistoryImport,
} from './board-history-import.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

// Archives can never be deleted, so each run uses years no other run uses.
function unusedYear() {
  const start = 3000 + Math.floor(Math.random() * 5000)
  return `${start}-${start + 1}`
}

describeWithDatabase('Board Archives', () => {
  it('freezes the current board for an academic year, audited', async () => {
    const academicYear = unusedYear()
    const member = await createMemberWithBoardAuthority({
      actorEmail: 'admin@example.com',
      boardPosition: `Archivist ${academicYear}`,
      displayName: 'Ada Archivist',
      email: `archivist-${crypto.randomUUID()}@example.com`,
    })

    const created = await createBoardArchive({
      academicYear: academicYear.replace('-', '/'),
      actorEmail: 'admin@example.com',
    })
    const archive = (await listPublicBoardArchives()).boardArchives.find(
      (entry) => entry.academicYear === academicYear,
    )

    expect(created.academicYear).toBe(academicYear)
    expect(archive?.boardMembers).toContainEqual({
      boardPosition: `Archivist ${academicYear}`,
      displayName: 'Ada Archivist',
    })
    expect(JSON.stringify(archive)).not.toContain(member.id)
    expect(JSON.stringify(archive)).not.toContain(member.email)

    // Later changes to the Member do not change the archive.
    await getDb()
      .update(members)
      .set({ displayName: 'Renamed Archivist' })
      .where(eq(members.id, member.id))
    const unchanged = (await listPublicBoardArchives()).boardArchives.find(
      (entry) => entry.academicYear === academicYear,
    )
    expect(unchanged?.boardMembers).toContainEqual({
      boardPosition: `Archivist ${academicYear}`,
      displayName: 'Ada Archivist',
    })

    const [stored] = await getDb()
      .select()
      .from(boardArchives)
      .where(eq(boardArchives.academicYear, academicYear))
    const audit = await getDb()
      .select({ action: auditEntries.action })
      .from(auditEntries)
      .where(eq(auditEntries.targetId, stored.id))
    expect(stored.source).toBe('portal')
    expect(audit.map((entry) => entry.action)).toEqual([
      'board_archive.created',
    ])
  })

  it('allows one archive per academic year', async () => {
    const academicYear = unusedYear()
    await importBoardArchive({
      academicYear,
      actorEmail: 'superuser@example.com',
      entries: [{ boardPosition: 'President', displayName: 'First Board' }],
    })

    await expect(
      createBoardArchive({ academicYear, actorEmail: 'admin@example.com' }),
    ).rejects.toThrow(BoardArchiveExistsError)
  })

  it('rejects any edit or delete in the database', async () => {
    const academicYear = unusedYear()
    await importBoardArchive({
      academicYear,
      actorEmail: 'superuser@example.com',
      entries: [{ boardPosition: 'President', displayName: 'Frozen Name' }],
    })
    const [archive] = await getDb()
      .select()
      .from(boardArchives)
      .where(eq(boardArchives.academicYear, academicYear))

    await expect(
      getDb()
        .update(boardArchiveEntries)
        .set({ displayName: 'Edited' })
        .where(eq(boardArchiveEntries.archiveId, archive.id)),
    ).rejects.toThrow()
    await expect(
      getDb()
        .delete(boardArchiveEntries)
        .where(eq(boardArchiveEntries.archiveId, archive.id)),
    ).rejects.toThrow()
    await expect(
      getDb().delete(boardArchives).where(eq(boardArchives.id, archive.id)),
    ).rejects.toThrow()
  })

  it('imports legacy years newest first, skipping years already archived', async () => {
    const older = unusedYear()
    const newer = `${Number(older.slice(0, 4)) + 1}-${Number(older.slice(0, 4)) + 2}`
    const entries = [{ boardPosition: 'President', displayName: 'Legacy Lead' }]
    const history = [
      { academicYear: older, entries, skipped: [] },
      { academicYear: newer, entries, skipped: [] },
    ]

    const first = planBoardHistoryImport(history, await listBoardArchiveYears())
    await applyBoardHistoryImport(first, 'superuser@example.com')
    const second = planBoardHistoryImport(
      history,
      await listBoardArchiveYears(),
    )

    expect(first.importable.map((year) => year.academicYear)).toEqual([
      older,
      newer,
    ])
    expect(second.importable).toEqual([])
    const years = (await listPublicBoardArchives()).boardArchives.map(
      (archive) => archive.academicYear,
    )
    expect(years.indexOf(newer)).toBeLessThan(years.indexOf(older))
  })
})
