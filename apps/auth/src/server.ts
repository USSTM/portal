import { config } from 'dotenv'
import { serve } from '@hono/node-server'
import { importJWK } from 'jose'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { createAuthApp, type AuthClient } from './app.js'
import { googleBoundary } from './google.js'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))

config({ path: [join(repoRoot, '.env.local'), join(repoRoot, '.env')] })

const port = Number(process.env.AUTH_PORT ?? 3001)
const clients = parseClients(process.env.AUTH_CLIENTS)
const privateKey = await importPrivateKey(process.env.AUTH_SESSION_PRIVATE_JWK)

const authApp = createAuthApp({
  clients,
  google: googleBoundary,
  issuer: requiredEnvironment('AUTH_SESSION_ISSUER'),
  key: privateKey,
  keyId: requiredEnvironment('AUTH_SESSION_KEY_ID'),
})

serve({ fetch: authApp.fetch, port })

function parseClients(value: string | undefined): AuthClient[] {
  const clients: unknown = JSON.parse(requiredEnvironmentValue(value, 'AUTH_CLIENTS'))
  if (!Array.isArray(clients) || clients.some((client) => !isAuthClient(client))) {
    throw new Error('AUTH_CLIENTS must contain valid allowlisted clients')
  }
  return clients
}

function isAuthClient(value: unknown): value is AuthClient {
  if (typeof value !== 'object' || value === null) return false
  const client = value as Record<string, unknown>
  return (
    typeof client.audience === 'string' &&
    typeof client.callbackPath === 'string' &&
    client.callbackPath.startsWith('/auth/') &&
    typeof client.clientId === 'string' &&
    typeof client.clientSecret === 'string' &&
    typeof client.cookieName === 'string' &&
    client.cookieName.startsWith('__Host-') &&
    typeof client.origin === 'string' &&
    new URL(client.origin).origin === client.origin
  )
}

async function importPrivateKey(value: string | undefined) {
  return importJWK(
    JSON.parse(requiredEnvironmentValue(value, 'AUTH_SESSION_PRIVATE_JWK')),
    'ES256',
  ) as Promise<CryptoKey>
}

function requiredEnvironment(name: string) {
  return requiredEnvironmentValue(process.env[name], name)
}

function requiredEnvironmentValue(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required`)
  return value
}
