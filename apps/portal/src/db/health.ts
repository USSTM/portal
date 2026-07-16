import { sql } from 'drizzle-orm'

import { getDb } from './index.js'

export async function checkDatabase() {
  await getDb().execute(sql`select 1`)
}
