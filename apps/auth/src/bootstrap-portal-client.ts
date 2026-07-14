import { createHash, randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"

import { pool } from "./database.js"
import { migrate } from "./migrate.js"

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

export async function bootstrapPortalClient() {
  await migrate()
  const clientId = required("PORTAL_OAUTH_CLIENT_ID")
  const clientSecret = required("PORTAL_OAUTH_CLIENT_SECRET")
  const redirectUri =
    process.env.PORTAL_OAUTH_REDIRECT_URI ??
    "http://localhost:3000/auth/callback"
  const existing = await pool.query(
    `select 1 from "oauthClient" where "clientId" = $1`,
    [clientId],
  )
  if (existing.rowCount)
    throw new Error("Portal OAuth client is already registered")

  const secretHash = createHash("sha256")
    .update(clientSecret)
    .digest("base64url")
  await pool.query(
    `insert into "oauthClient" (
       id, "clientId", "clientSecret", "skipConsent", scopes, name,
       "redirectUris", "tokenEndpointAuthMethod", "grantTypes",
       "responseTypes", public, type, "requirePKCE", "createdAt", "updatedAt"
     ) values ($1, $2, $3, true, $4, 'USSTM Portal', $5,
       'client_secret_post', $6, $7, false, 'web', true,
       current_timestamp, current_timestamp)`,
    [
      randomUUID(),
      clientId,
      secretHash,
      JSON.stringify(["openid", "email", "profile", "offline_access"]),
      JSON.stringify([redirectUri]),
      JSON.stringify(["authorization_code", "refresh_token"]),
      JSON.stringify(["code"]),
    ],
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await bootstrapPortalClient()
  console.log("Registered the USSTM Portal OAuth client")
  await pool.end()
}
