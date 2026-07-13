import { drizzle } from "drizzle-orm/postgres-js"
import { sql } from "drizzle-orm"
import postgres from "postgres"

export async function databaseIsReady(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) return false

  const client = postgres(databaseUrl, { max: 1 })

  try {
    await drizzle(client).execute(sql`select 1`)
    return true
  } catch {
    return false
  } finally {
    await client.end({ timeout: 1 })
  }
}
