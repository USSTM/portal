import { randomUUID } from "node:crypto"

import { migrate, pool } from "./database"
import { absoluteLifetimeMs, evaluateSession, idleLifetimeMs } from "./session"

export async function createFlow(
  state: string,
  codeVerifier: string,
  now = new Date(),
) {
  await migrate()
  const id = randomUUID()
  await pool.query(
    `insert into "oauthFlow" (id, state, "codeVerifier", "expiresAt") values ($1, $2, $3, $4)`,
    [id, state, codeVerifier, new Date(now.getTime() + 10 * 60 * 1000)],
  )
  return id
}

export async function consumeFlow(id: string, now = new Date()) {
  await migrate()
  const result = await pool.query<{ state: string; codeVerifier: string }>(
    `delete from "oauthFlow" where id = $1 and "expiresAt" > $2 returning state, "codeVerifier"`,
    [id, now],
  )
  return result.rowCount === 0 ? null : result.rows[0]
}

type NewSession = {
  subject: string
  email: string
  accessToken: string
  refreshToken?: string
  accessTokenExpiresAt: Date
}

export async function createPortalSession(input: NewSession, now = new Date()) {
  await migrate()
  const id = randomUUID()
  await pool.query(
    `insert into "portalSession" (id, subject, email, "accessToken", "refreshToken", "accessTokenExpiresAt", "idleExpiresAt", "absoluteExpiresAt") values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      input.subject,
      input.email,
      input.accessToken,
      input.refreshToken ?? null,
      input.accessTokenExpiresAt,
      new Date(now.getTime() + idleLifetimeMs),
      new Date(now.getTime() + absoluteLifetimeMs),
    ],
  )
  return id
}

export type StoredPortalSession = NewSession & {
  id: string
  idleExpiresAt: Date
  absoluteExpiresAt: Date
  revokedAt: Date | null
}

export async function readActiveSession(id: string, now = new Date()) {
  await migrate()
  const result = await pool.query<StoredPortalSession>(
    `select id, subject, email, "accessToken", "refreshToken", "accessTokenExpiresAt", "idleExpiresAt", "absoluteExpiresAt", "revokedAt" from "portalSession" where id = $1`,
    [id],
  )
  if (result.rowCount === 0) return null
  const session = result.rows[0]
  const lifetime = evaluateSession(session, now)
  if (!lifetime.active) return null
  await pool.query(
    `update "portalSession" set "idleExpiresAt" = $2 where id = $1`,
    [id, lifetime.nextIdleExpiresAt],
  )
  return session
}

export async function updateTokens(
  id: string,
  accessToken: string,
  refreshToken: string | undefined,
  accessTokenExpiresAt: Date,
) {
  await pool.query(
    `update "portalSession" set "accessToken" = $2, "refreshToken" = coalesce($3, "refreshToken"), "accessTokenExpiresAt" = $4 where id = $1 and "revokedAt" is null`,
    [id, accessToken, refreshToken ?? null, accessTokenExpiresAt],
  )
}

export async function revokePortalSession(id: string) {
  await migrate()
  const result = await pool.query<{
    accessToken: string
    refreshToken?: string
  }>(
    `update "portalSession" set "revokedAt" = current_timestamp where id = $1 and "revokedAt" is null returning "accessToken", "refreshToken"`,
    [id],
  )
  return result.rowCount === 0 ? null : result.rows[0]
}
