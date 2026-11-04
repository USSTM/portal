// One-time copy of the retired StudentGroups collection into Portal Club
// Profiles (ticket 08). The remove_student_groups migration keeps the rows in
// student_groups_archive; scripts/export-student-groups.ts turns them into the
// JSON that the Portal's `db:import-club-profiles` script reads.

export interface StudentGroupArchiveRow {
  name: string
  short_name: string | null
  type: string | null
  contact_email: string | null
  instagram: string | null
  website: string | null
  is_active: boolean | null
  description: unknown
  logo_filename: string | null
}

export interface ExportedStudentGroup {
  name: string
  shortName: string | null
  type: 'student_group' | 'course_union' | null
  contactEmail: string | null
  instagram: string | null
  website: string | null
  active: boolean
  description: string | null
  logoUrl: string | null
}

export function exportStudentGroup(
  row: StudentGroupArchiveRow,
  serverUrl: string,
): ExportedStudentGroup {
  return {
    active: row.is_active !== false,
    contactEmail: blankToNull(row.contact_email),
    description: blankToNull(lexicalToPlainText(row.description)),
    instagram: blankToNull(row.instagram),
    logoUrl: row.logo_filename
      ? new URL(
          `/api/media/file/${encodeURIComponent(row.logo_filename)}`,
          serverUrl,
        ).toString()
      : null,
    name: row.name.trim(),
    shortName: blankToNull(row.short_name),
    type:
      row.type === 'sg'
        ? 'student_group'
        : row.type === 'cu'
          ? 'course_union'
          : null,
    website: blankToNull(row.website),
  }
}

type LexicalNode = { children?: LexicalNode[]; text?: string; type?: string }

const blockTypes = new Set(['paragraph', 'heading', 'quote', 'listitem'])

/** Flattens Lexical rich text to plain text, one line per block. */
export function lexicalToPlainText(value: unknown): string {
  const root = (value as { root?: LexicalNode } | null)?.root
  if (!root) return ''
  const blocks: string[] = []
  const collect = (node: LexicalNode): string => {
    if (node.type === 'linebreak') return '\n'
    if (typeof node.text === 'string') return node.text
    return (node.children ?? []).map(collect).join('')
  }
  const walk = (node: LexicalNode) => {
    if (node.type && blockTypes.has(node.type)) {
      blocks.push(collect(node))
      return
    }
    node.children?.forEach(walk)
  }
  walk(root)
  return blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .join('\n\n')
}

function blankToNull(value: string | null | undefined) {
  return value?.trim() || null
}
