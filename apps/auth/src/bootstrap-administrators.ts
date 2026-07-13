import { fileURLToPath } from "node:url"

import { parseUSSTMAdministratorEmails } from "./bootstrap-input.js"
import { pool } from "./database.js"
import { migrate } from "./migrate.js"

export async function bootstrapUSSTMAdministrators(emails: string[]) {
  await migrate()
  const existing = await pool.query(
    `select 1 from "usstmAdministrator" limit 1`,
  )
  if (existing.rowCount) {
    throw new Error("USSTM Administrators have already been bootstrapped")
  }

  const client = await pool.connect()
  try {
    await client.query("begin")
    for (const email of parseUSSTMAdministratorEmails(emails)) {
      await client.query(
        `insert into "usstmAdministrator" (email) values ($1)`,
        [email],
      )
    }
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await bootstrapUSSTMAdministrators(process.argv.slice(2))
  console.log("Bootstrapped three USSTM Administrators")
  await pool.end()
}
