// Writes the archived BoardHistory as JSON for the Portal's one-time
// `db:import-board-archives` script (ticket 11):
//
//   pnpm --filter @usstm/website export:board-history --output <file>
//
// The remove_board_history migration keeps each year in board_history_archive.
// Needs DATABASE_URI for the Website database. It writes to a file because
// Payload logs to stdout while it starts.
import 'dotenv/config'
import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import {
  boardHistoryFromArchive,
  exportBoardHistory,
  type BoardHistoryArchiveRow,
} from '../src/lib/board-history-export'

const { values } = parseArgs({ options: { output: { type: 'string' } } })
if (!values.output) {
  throw new Error('Usage: pnpm export:board-history --output <file>')
}

const payload = await getPayload({ config })
const result = await payload.db.drizzle.execute(
  sql`SELECT * FROM "board_history_archive"`,
)
const archives = boardHistoryFromArchive(
  result.rows as unknown as BoardHistoryArchiveRow[],
).map(exportBoardHistory)
await writeFile(values.output, `${JSON.stringify(archives, null, 2)}\n`)
console.error(`Exported ${archives.length} board years to ${values.output}`)
await payload.destroy()
