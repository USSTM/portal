import { describe, expect, it } from 'vitest'

import { checkDatabase } from './health.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('database health', () => {
  it('connects to PostgreSQL', async () => {
    await expect(checkDatabase()).resolves.toBeUndefined()
  })
})
