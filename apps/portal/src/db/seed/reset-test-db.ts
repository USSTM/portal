import { resetDatabaseToBaseline } from './reset-to-baseline.ts'

async function main() {
  const report = await resetDatabaseToBaseline()
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
