import { parseArgs } from 'node:util'
import { resolve } from 'node:path'

import { z } from 'zod'

import {
  importLegacyExport,
  LegacyImportValidationError,
  loadLegacyExport,
  prepareLegacyImport,
} from './import.js'

async function main() {
  const { values } = parseArgs({
    options: {
      apply: { default: false, type: 'boolean' },
      source: { short: 's', type: 'string' },
    },
  })
  if (!values.source) {
    throw new Error(
      'Usage: pnpm db:import-legacy --source <directory> [--apply]',
    )
  }

  const sourceDirectory = resolve(
    process.env.INIT_CWD ?? process.cwd(),
    values.source,
  )
  const source = await loadLegacyExport(sourceDirectory)
  const report = values.apply
    ? await importLegacyExport(source)
    : { ...prepareLegacyImport(source).report, mode: 'dry-run' }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error: unknown) => {
  if (error instanceof LegacyImportValidationError) {
    const invalidReferences = error.issues.filter((issue) =>
      /missing (Club|Event|Owning Club)/.test(issue),
    )
    const invalidTimestamps = error.issues.filter((issue) =>
      issue.includes('invalid timestamp'),
    )
    const otherIssues = error.issues.filter(
      (issue) =>
        !invalidReferences.includes(issue) &&
        !invalidTimestamps.includes(issue),
    )
    console.error(
      JSON.stringify(
        {
          mode: 'invalid',
          verification: { invalidReferences, invalidTimestamps, otherIssues },
        },
        null,
        2,
      ),
    )
    process.exitCode = 1
    return
  }
  if (error instanceof z.ZodError) {
    console.error(
      JSON.stringify(
        {
          mode: 'invalid',
          verification: {
            schemaIssues: error.issues.map((issue) => ({
              message: issue.message,
              path: issue.path.join('.'),
            })),
          },
        },
        null,
        2,
      ),
    )
    process.exitCode = 1
    return
  }
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
