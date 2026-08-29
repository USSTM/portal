import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { get } from 'node:https'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const projectName = `usstm-deployment-test-${process.pid}`
const httpsPort = 18443 + (process.pid % 1000)
const backupRepository = mkdtempSync(join(tmpdir(), 'usstm-backup-test-'))
const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
})
const environment = {
  ...process.env,
  AUTH_CLIENTS: JSON.stringify([
    {
      audience: 'portal',
      callbackPath: '/auth/callback',
      clientId: 'deployment-test',
      clientSecret: 'deployment-test',
      cookieName: '__Host-portal-session',
      origin: `https://localhost:${httpsPort}`,
    },
  ]),
  AUTH_SESSION_ISSUER: 'usstm-auth',
  AUTH_SESSION_KEY_ID: 'deployment-test',
  AUTH_SESSION_PRIVATE_JWK: JSON.stringify(
    privateKey.export({ format: 'jwk' }),
  ),
  COMPOSE_PROJECT_NAME: projectName,
  DATABASE_NAME: 'usstm_portal',
  DATABASE_PASSWORD: 'deployment-test',
  DATABASE_USER: 'usstm',
  DATABASE_URL: 'postgresql://usstm:deployment-test@postgres:5432/usstm_portal',
  PORTAL_ADDRESS: 'https://localhost',
  PORTAL_AUTH_ISSUER: 'usstm-auth',
  PORTAL_AUTH_KEY_ID: 'deployment-test',
  PORTAL_AUTH_PUBLIC_JWK: JSON.stringify(publicKey.export({ format: 'jwk' })),
  PORTAL_CONTACT_EMAIL: 'info@example.test',
  PORTAL_CONTACT_INSTAGRAM: 'https://instagram.com/example',
  PORTAL_CONTACT_LINKTREE: 'https://linktr.ee/example',
  PORTAL_CONTACT_WEBSITE: 'https://example.test',
  PORTAL_HTTPS_PORT: String(httpsPort),
  PORTAL_SUPERUSER_EMAIL: 'admin@example.test',
  RESTIC_PASSWORD: 'deployment-test-encryption-key',
  RESTIC_REPOSITORY: '/test-repository',
}

function compose(...args) {
  return execFileSync(
    'docker',
    ['compose', '-f', 'compose.production.yaml', ...args],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
}

async function request(path) {
  return new Promise((resolve, reject) => {
    const request = get(
      {
        hostname: 'localhost',
        path,
        port: httpsPort,
        rejectUnauthorized: false,
      },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () =>
          resolve({
            body,
            headers: response.headers,
            status: response.statusCode,
          }),
        )
      },
    )
    request.on('error', reject)
  })
}

async function waitFor(path) {
  let lastError
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await request(path)
      if (response.status === 200) return response
      lastError = new Error(
        `received HTTP ${response.status}: ${response.body}`,
      )
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
  throw lastError
}

before(
  () => {
    try {
      compose('up', '--detach', '--build', '--wait')
    } catch (error) {
      let logs = ''
      try {
        logs = compose('logs', '--no-color')
      } catch {
        // The original startup error remains the useful failure.
      }
      error.message = `${error.message}\n${logs}`
      throw error
    }
  },
  { timeout: 180_000 },
)

after(() => {
  try {
    compose('down', '--volumes')
  } catch {
    // Preserve the original test failure when cleanup also fails.
  }
  rmSync(backupRepository, { force: true, recursive: true })
})

test('Caddy serves Portal health and proxies auth with one request ID', async () => {
  const portal = await waitFor('/health/live')
  const auth = await waitFor('/auth/health/live')

  assert.deepEqual(JSON.parse(portal.body), { service: 'portal', status: 'ok' })
  assert.deepEqual(JSON.parse(auth.body), { service: 'auth', status: 'ok' })
  assert.match(portal.headers['x-request-id'], /^[0-9a-f-]{36}$/)
  assert.match(auth.headers['x-request-id'], /^[0-9a-f-]{36}$/)
})

test('Portal and auth emit structured request logs with Caddy request IDs', async () => {
  const portal = await request('/health/live')
  const auth = await request('/auth/health/live')

  const portalLogs = structuredLogs('portal')
  const authLogs = structuredLogs('auth')

  assert.ok(
    portalLogs.some(
      (entry) =>
        entry.service === 'portal' &&
        entry.path === '/health/live' &&
        entry.requestId === portal.headers['x-request-id'],
    ),
    `Portal request ID ${portal.headers['x-request-id']} was not found in ${JSON.stringify(portalLogs)}`,
  )
  assert.ok(
    authLogs.some(
      (entry) =>
        entry.service === 'auth' &&
        entry.path === '/auth/health/live' &&
        entry.requestId === auth.headers['x-request-id'],
    ),
    `Auth request ID ${auth.headers['x-request-id']} was not found in ${JSON.stringify(authLogs)}`,
  )
})

test('operator command applies production database migrations', () => {
  assert.doesNotThrow(() =>
    compose('--profile', 'operations', 'run', '--rm', '--build', 'migrate'),
  )
})

test('operator command writes an encrypted PostgreSQL backup to configured storage', () => {
  const volume = `${backupRepository}:/test-repository`

  compose('run', '--rm', '--volume', volume, 'backup', 'backup-now')
  const snapshots = JSON.parse(
    compose(
      'run',
      '--rm',
      '--volume',
      volume,
      'backup',
      'restic',
      'snapshots',
      '--json',
    ),
  )

  assert.equal(snapshots.length, 1)
  assert.match(snapshots[0].paths[0], /^\/usstm-portal-.*\.dump$/)
})

function structuredLogs(service) {
  return compose('logs', '--no-color', '--no-log-prefix', service)
    .split('\n')
    .flatMap((line) => {
      const jsonStart = line.indexOf('{')
      if (jsonStart === -1) return []
      try {
        return [JSON.parse(line.slice(jsonStart))]
      } catch {
        return []
      }
    })
}
