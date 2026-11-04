// Writes the archived Student Groups as JSON for the Portal's one-time
// `db:import-club-profiles` script (ticket 08):
//
//   pnpm --filter @usstm/website export:student-groups --output <file>
//
// Needs DATABASE_URI for the Website database and NEXT_PUBLIC_SERVER_URL, the
// Website's public origin, from which the Portal downloads each logo. It writes
// to a file because Payload logs to stdout while it starts.
import 'dotenv/config'
import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import {
  exportStudentGroup,
  type StudentGroupArchiveRow,
} from '../src/lib/student-groups-export'

const { values } = parseArgs({ options: { output: { type: 'string' } } })
if (!values.output) {
  throw new Error('Usage: pnpm export:student-groups --output <file>')
}
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
if (!serverUrl) throw new Error('NEXT_PUBLIC_SERVER_URL is required')

const payload = await getPayload({ config })
const result = await payload.db.drizzle.execute(
  sql`SELECT * FROM "student_groups_archive" ORDER BY "name"`,
)
const rows = result.rows as unknown as StudentGroupArchiveRow[]
const groups = rows.map((row) => exportStudentGroup(row, serverUrl))
await writeFile(values.output, `${JSON.stringify(groups, null, 2)}\n`)
console.error(`Exported ${groups.length} Student Groups to ${values.output}`)
await payload.destroy()
