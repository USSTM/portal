import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { listBoardArchiveYears } from './board-archives.js'
import {
  applyBoardHistoryImport,
  exportedBoardHistorySchema,
  planBoardHistoryImport,
} from './board-history-import.js'

// pnpm --filter @usstm/portal db:import-board-archives --source <file> [--apply]
//
// Without --apply, prints the plan. With it, creates one Board Archive per
// importable year as the Superuser, which writes Audit Entries.
async function main() {
  const { values } = parseArgs({
    options: {
      apply: { default: false, type: 'boolean' },
      source: { short: 's', type: 'string' },
    },
  })
  if (!values.source) {
    throw new Error(
      'Usage: pnpm db:import-board-archives --source <board-history.json> [--apply]',
    )
  }

  const source = resolve(process.env.INIT_CWD ?? process.cwd(), values.source)
  const history = exportedBoardHistorySchema.parse(
    JSON.parse(await readFile(source, 'utf8')),
  )
  const plan = planBoardHistoryImport(history, await listBoardArchiveYears())
  const summary = plan.importable.map((year) => ({
    academicYear: year.academicYear,
    entries: year.entries.length,
    skippedPeople: year.skippedPeople,
  }))

  if (!values.apply) {
    console.log(
      JSON.stringify(
        {
          importable: summary,
          mode: 'dry-run',
          notImported: plan.notImported,
        },
        null,
        2,
      ),
    )
    return
  }

  const superuserEmail = process.env.PORTAL_SUPERUSER_EMAIL
  if (!superuserEmail) throw new Error('PORTAL_SUPERUSER_EMAIL is required')
  const imported = await applyBoardHistoryImport(plan, superuserEmail)
  console.log(
    JSON.stringify(
      { imported, mode: 'applied', notImported: plan.notImported },
      null,
      2,
    ),
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
