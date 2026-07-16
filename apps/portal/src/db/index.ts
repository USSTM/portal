import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema.ts'

let pool: Pool | undefined

export function getDb() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for database access.')
  }

  pool ??= new Pool({ connectionString })

  return drizzle(pool, { schema })
}
