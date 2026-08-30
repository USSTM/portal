import { config as loadDotenv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

// Always point local integration test runs at the dedicated test database
// (.env.test), regardless of what .env.local or the ambient shell has set for
// DATABASE_URL, so tests can never write into the interactive dev database.
// Skipped in CI, where the job already provides its own ephemeral DATABASE_URL.
if (!process.env.CI) {
  loadDotenv({ path: join(repoRoot, '.env.test'), override: true })
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/db/integration-test-setup.ts'],
    // All integration test files share one physical test database and truncate
    // it between tests, so files must not run concurrently against it.
    fileParallelism: false,
  },
})
