// One-time copy of the Website's BoardHistory into Portal Board Archives
// (ticket 11). Board Archives hold names and Board Positions only, so each
// year's groups of People are flattened in order, dropping photos, bios and
// emails. scripts/export-board-history.ts writes the result as JSON for the
// Portal's `db:import-board-archives` script.

type PersonValue = number | { name?: string | null; position?: string | null }

export interface BoardHistoryDocument {
  academicYear: string
  groups?: Array<{
    groupName: string
    members?: PersonValue[] | null
  }> | null
}

export interface ExportedBoardArchive {
  academicYear: string
  entries: Array<{ displayName: string; boardPosition: string }>
  /** People that could not be exported, for a human to check. */
  skipped: string[]
}

/** A row of board_history_archive, written by the remove_board_history migration. */
export interface BoardHistoryArchiveRow {
  academic_year: string
  group_order: number
  group_name: string
  member_order: number | null
  person_name: string | null
  person_position: string | null
}

/** Rebuilds each year's ordered groups of people from the archive rows. */
export function boardHistoryFromArchive(
  rows: BoardHistoryArchiveRow[],
): BoardHistoryDocument[] {
  const years = new Map<
    string,
    Map<number, { groupName: string; members: Array<[number, PersonValue]> }>
  >()
  for (const row of rows) {
    const groups = years.get(row.academic_year) ?? new Map()
    years.set(row.academic_year, groups)
    const group = groups.get(row.group_order) ?? {
      groupName: row.group_name,
      members: [],
    }
    groups.set(row.group_order, group)
    // A group with no people has one row with no member.
    if (row.member_order !== null) {
      group.members.push([
        row.member_order,
        { name: row.person_name, position: row.person_position },
      ])
    }
  }
  return [...years]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([academicYear, groups]) => ({
      academicYear,
      groups: [...groups]
        .sort(([a], [b]) => a - b)
        .map(([, group]) => ({
          groupName: group.groupName,
          members: group.members
            .sort(([a], [b]) => a - b)
            .map(([, person]) => person),
        })),
    }))
}

export function exportBoardHistory(
  document: BoardHistoryDocument,
): ExportedBoardArchive {
  const entries: ExportedBoardArchive['entries'] = []
  const skipped: string[] = []
  for (const group of document.groups ?? []) {
    for (const person of group.members ?? []) {
      if (typeof person === 'number') {
        skipped.push(`${group.groupName}: person ${person} no longer exists`)
        continue
      }
      const displayName = person.name?.trim()
      if (!displayName) {
        skipped.push(`${group.groupName}: a person has no name`)
        continue
      }
      entries.push({
        // A person's own position, or the group name when it is blank.
        boardPosition: person.position?.trim() || group.groupName.trim(),
        displayName,
      })
    }
  }
  return { academicYear: document.academicYear.trim(), entries, skipped }
}
