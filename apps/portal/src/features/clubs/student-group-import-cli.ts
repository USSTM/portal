import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import {
  applyClubProfileImport,
  exportedStudentGroupsSchema,
  listClubsForImport,
  planClubProfileImport,
} from './student-group-import.js'

// pnpm --filter @usstm/portal db:import-club-profiles --source <file> [--apply]
//
// Without --apply, prints the plan. With it, fills empty Club Profile fields and
// copies logos as the Superuser, which writes Audit Entries (ADR-0010). Either
// way, `unmatched` lists the Student Groups a person must resolve by hand.
async function main() {
  const { values } = parseArgs({
    options: {
      apply: { default: false, type: 'boolean' },
      source: { short: 's', type: 'string' },
    },
  })
  if (!values.source) {
    throw new Error(
      'Usage: pnpm db:import-club-profiles --source <student-groups.json> [--apply]',
    )
  }

  const source = resolve(process.env.INIT_CWD ?? process.cwd(), values.source)
  const groups = exportedStudentGroupsSchema.parse(
    JSON.parse(await readFile(source, 'utf8')),
  )
  const plan = planClubProfileImport(groups, await listClubsForImport())
  const unmatched = plan.unmatched

  if (!values.apply) {
    console.log(
      JSON.stringify(
        {
          matched: plan.matched.map((entry) => ({
            club: entry.club.shortName,
            filled: entry.filled,
            group: entry.group,
            logo: entry.logoUrl ? 'will copy' : 'none or kept',
            skipped: entry.skipped,
          })),
          mode: 'dry-run',
          unmatched,
        },
        null,
        2,
      ),
    )
    return
  }

  const superuserEmail = process.env.PORTAL_SUPERUSER_EMAIL
  if (!superuserEmail) throw new Error('PORTAL_SUPERUSER_EMAIL is required')
  const matched = await applyClubProfileImport(plan, {
    email: superuserEmail,
    privileged: true,
  })
  console.log(JSON.stringify({ matched, mode: 'applied', unmatched }, null, 2))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
