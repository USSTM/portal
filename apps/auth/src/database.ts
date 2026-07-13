import { Pool } from "pg"

import type { AdmissionFacts } from "./admission.js"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required")
}

export const pool = new Pool({
  connectionString: databaseUrl,
  options: "-c search_path=auth",
})

export async function databaseIsReady() {
  try {
    await pool.query("select 1")
    return true
  } catch {
    return false
  }
}

export async function bindUSSTMAdministrator(email: string, userId: string) {
  await pool.query(
    `update "usstmAdministrator"
       set "userId" = $1, "boundAt" = coalesce("boundAt", current_timestamp)
     where "email" = lower($2)
       and ("userId" is null or "userId" = $1)`,
    [userId, email],
  )
}

export async function getAdmissionFacts(
  userId: string,
): Promise<AdmissionFacts> {
  const result = await pool.query<{
    emailVerified: boolean
    usstmAdministrator: boolean
  }>(
    `select u."emailVerified",
            exists(select 1 from "usstmAdministrator" a where a."userId" = u.id) as "usstmAdministrator"
       from "user" u
      where u.id = $1`,
    [userId],
  )
  const identity = result.rows[0]

  return {
    emailVerified: identity?.emailVerified ?? false,
    isUSSTMAdministrator: identity?.usstmAdministrator ?? false,
  }
}

export async function getIdentity(userId: string) {
  const result = await pool.query<{ email: string }>(
    `select email from "user" where id = $1`,
    [userId],
  )
  return result.rows[0]
}
