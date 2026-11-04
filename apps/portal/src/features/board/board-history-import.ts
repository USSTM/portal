import { z } from 'zod'

import { importBoardArchive, normalizeAcademicYear } from './board-archives.js'
import type { BoardArchiveEntry } from './board-archives.js'

// One-time legacy import of the Website's BoardHistory into Board Archives
// (ticket 11). Reads the JSON written by the Website's `export:board-history`
// script. Years that already have a Board Archive are left alone: archives are
// immutable and there is no re-import.

export const exportedBoardHistorySchema = z.array(
  z.object({
    academicYear: z.string(),
    entries: z.array(
      z.object({ boardPosition: z.string(), displayName: z.string() }),
    ),
    skipped: z.array(z.string()),
  }),
)

export type ExportedBoardHistory = z.infer<typeof exportedBoardHistorySchema>

export type BoardHistoryImportPlan = {
  importable: Array<{
    academicYear: string
    entries: BoardArchiveEntry[]
    skippedPeople: string[]
  }>
  notImported: Array<{ academicYear: string; reason: string }>
}

export function planBoardHistoryImport(
  history: ExportedBoardHistory,
  existingYears: Set<string>,
): BoardHistoryImportPlan {
  const plan: BoardHistoryImportPlan = { importable: [], notImported: [] }
  const planned = new Set<string>()
  for (const year of history) {
    const academicYear = normalizeAcademicYear(year.academicYear)
    const notImported = (reason: string) =>
      plan.notImported.push({ academicYear: year.academicYear, reason })
    if (!academicYear) {
      notImported('Not an academic year such as 2023-2024')
    } else if (existingYears.has(academicYear)) {
      notImported(`A Board Archive for ${academicYear} already exists`)
    } else if (planned.has(academicYear)) {
      notImported(`${academicYear} appears more than once in the export`)
    } else if (year.entries.length === 0) {
      notImported('No people with a name')
    } else {
      planned.add(academicYear)
      plan.importable.push({
        academicYear,
        entries: year.entries,
        skippedPeople: year.skipped,
      })
    }
  }
  return plan
}

export async function applyBoardHistoryImport(
  plan: BoardHistoryImportPlan,
  actorEmail: string,
) {
  const imported = []
  for (const year of plan.importable) {
    imported.push(
      await importBoardArchive({
        academicYear: year.academicYear,
        actorEmail,
        entries: year.entries,
      }),
    )
  }
  return imported
}
