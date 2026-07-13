import { readFile, readdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import { pool } from "./database.js"

const migrationsDirectory = fileURLToPath(
  new URL("../migrations", import.meta.url),
)

export async function migrate() {
  await pool.query(`
    create table if not exists "schemaMigration" (
      "name" text primary key,
      "appliedAt" timestamptz default current_timestamp not null
    )
  `)

  for (const name of (await readdir(migrationsDirectory)).sort()) {
    if (!name.endsWith(".sql")) continue
    const applied = await pool.query(
      `select 1 from "schemaMigration" where name = $1`,
      [name],
    )
    if (applied.rowCount) continue

    const client = await pool.connect()
    try {
      await client.query("begin")
      await client.query(
        await readFile(`${migrationsDirectory}/${name}`, "utf8"),
      )
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await migrate()
  await pool.end()
}
