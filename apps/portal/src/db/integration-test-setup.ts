import { beforeEach } from 'vitest'

import { resetDatabaseToBaseline } from './seed/reset-to-baseline.ts'

beforeEach(async () => {
  await resetDatabaseToBaseline()
})
