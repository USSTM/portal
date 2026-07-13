import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"

import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error("DATABASE_URL is required")

export const pool = new Pool({
  connectionString: databaseUrl,
  options: "-c search_path=portal",
})
let migration: Promise<void> | undefined

export function migrate() {
  migration ??= runMigrations()
  return migration
}

async function runMigrations() {
  await pool.query(
    `create table if not exists "schemaMigration" ("name" text primary key, "appliedAt" timestamptz default current_timestamp not null)`,
  )
  const directory = resolve(process.cwd(), "migrations")
  for (const name of (await readdir(directory)).sort()) {
    if (!name.endsWith(".sql")) continue
    const applied = await pool.query(
      `select 1 from "schemaMigration" where name = $1`,
      [name],
    )
    if (applied.rowCount) continue
    const client = await pool.connect()
    try {
      await client.query("begin")
      await client.query(await readFile(resolve(directory, name), "utf8"))
      await client.query(`insert into "schemaMigration" (name) values ($1)`, [
        name,
      ])
      await client.query("commit")
    } catch (error) {
      await client.query("rollback")
      throw error
    } finally {
      client.release()
    }
  }
}
