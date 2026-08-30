import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { generateKeyPairSync, sign } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { toJSON } from 'seroval'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
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
      origin: 'https://localhost',
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

const actors = {
  administrator: sessionCookie('administrator@example.test'),
  anonymous: undefined,
  boardMember: sessionCookie('board-member@example.test'),
  member: sessionCookie('member@example.test'),
  superuser: sessionCookie('admin@example.test'),
}

const ids = {
  club: '10000000-0000-4000-8000-000000000001',
  member: '20000000-0000-4000-8000-000000000001',
  boardMember: '20000000-0000-4000-8000-000000000002',
  administrator: '20000000-0000-4000-8000-000000000003',
  missing: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
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

function database(command) {
  return compose(
    'exec',
    '-T',
    'postgres',
    'psql',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    environment.DATABASE_USER,
    '-d',
    environment.DATABASE_NAME,
    '-c',
    command,
  )
}

async function request(path, init = {}) {
  const response = await fetch(`https://localhost:${httpsPort}${path}`, init)
  return {
    body: await response.text(),
    headers: Object.fromEntries(response.headers),
    status: response.status,
  }
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

async function callServerFunction(
  name,
  method,
  data,
  cookie,
  origin = 'https://localhost',
) {
  const id = serverFunctionId(name)
  const payload = JSON.stringify(toJSON(data === undefined ? {} : { data }))
  const headers = {
    accept: 'application/json',
    host: 'localhost',
    'sec-fetch-site':
      origin === 'https://localhost' ? 'same-origin' : 'cross-site',
    'x-tsr-serverfn': 'true',
  }
  if (cookie) headers.cookie = cookie
  if (method === 'POST') {
    headers['content-type'] = 'application/json'
    headers.origin = origin
  }
  return request(
    `/_serverFn/${id}${method === 'GET' ? `?payload=${encodeURIComponent(payload)}` : ''}`,
    { body: method === 'POST' ? payload : undefined, headers, method },
  )
}

const functionIds = new Map()

function serverFunctionId(name) {
  const cached = functionIds.get(name)
  if (cached) return cached
  const script = `
    import { readdir, readFile } from 'node:fs/promises'
    import { join } from 'node:path'
    const name = process.argv[1]
    const pending = ['/app/server/chunks/build']
    while (pending.length > 0) {
      const directory = pending.pop()
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) pending.push(path)
        else if (entry.name.endsWith('.mjs')) {
          const source = await readFile(path, 'utf8')
          const pattern = new RegExp('id: "([a-f0-9]{64})",\\\\s*name: "' + name + '"')
          const match = pattern.exec(source)
          if (match) { process.stdout.write(match[1]); process.exit(0) }
        }
      }
    }
    process.exit(1)
  `
  const id = compose(
    'exec',
    '-T',
    'portal',
    'node',
    '--input-type=module',
    '--eval',
    script,
    name,
  ).trim()
  functionIds.set(name, id)
  return id
}

function clientBundleContainsSecret(secret) {
  const script = `
    import { readdir, readFile } from 'node:fs/promises'
    import { join } from 'node:path'
    const secret = process.argv[1]
    const pending = ['/app/public']
    let found = false
    while (pending.length > 0 && !found) {
      const directory = pending.pop()
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) pending.push(path)
        else {
          const contents = await readFile(path, 'utf8').catch(() => '')
          if (contents.includes(secret)) {
            found = true
            break
          }
        }
      }
    }
    process.stdout.write(found ? 'found' : 'not-found')
  `
  return compose(
    'exec',
    '-T',
    'portal',
    'node',
    '--input-type=module',
    '--eval',
    script,
    secret,
  ).trim()
}

function sessionCookie(email) {
  const now = Math.floor(Date.now() / 1000)
  const header = encodeBase64Url(
    JSON.stringify({ alg: 'ES256', kid: 'deployment-test', typ: 'JWT' }),
  )
  const payload = encodeBase64Url(
    JSON.stringify({
      aud: 'portal',
      email,
      exp: now + 8 * 60 * 60,
      iat: now,
      iss: 'usstm-auth',
    }),
  )
  const unsigned = `${header}.${payload}`
  const signature = sign('sha256', Buffer.from(unsigned), {
    dsaEncoding: 'ieee-p1363',
    key: privateKey,
  })
  return `__Host-portal-session=${unsigned}.${signature.toString('base64url')}`
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url')
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

test('auth rejects a state-changing request from another Origin', async () => {
  const sameOrigin = await request('/auth/logout?client=portal', {
    headers: { host: 'localhost', origin: 'https://localhost' },
    method: 'POST',
  })
  const response = await request('/auth/logout?client=portal', {
    headers: { host: 'localhost', origin: 'https://evil.example' },
    method: 'POST',
  })

  assert.equal(sameOrigin.status, 204)
  assert.equal(response.status, 403)
  assert.equal(response.headers['set-cookie'], undefined)
})

test('Caddy applies restrictive browser security headers', async () => {
  const response = await request('/health/live')
  const contentSecurityPolicy = response.headers['content-security-policy']

  assert.match(contentSecurityPolicy, /default-src 'self'/)
  assert.match(contentSecurityPolicy, /object-src 'none'/)
  assert.match(contentSecurityPolicy, /frame-ancestors 'none'/)
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
  assert.equal(response.headers['x-frame-options'], 'DENY')
  assert.equal(
    response.headers['referrer-policy'],
    'strict-origin-when-cross-origin',
  )
  assert.equal(response.headers['cross-origin-opener-policy'], 'same-origin')
  assert.equal(
    response.headers['strict-transport-security'],
    'max-age=31536000; includeSubDomains',
  )
})

test('Caddy rejects request bodies larger than one megabyte', async () => {
  const response = await request('/auth/logout?client=portal', {
    body: 'x'.repeat(1024 * 1024 + 1),
    headers: {
      'content-type': 'application/octet-stream',
      host: 'localhost',
      origin: 'https://localhost',
    },
    method: 'POST',
  })

  assert.equal(response.status, 413)
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

test('production logs omit OAuth codes, cookies, tokens, and credentials', async () => {
  const secrets = [
    'oauth-code-deployment-secret',
    'cookie-deployment-secret',
    'google-token-deployment-secret',
    environment.DATABASE_PASSWORD,
    environment.AUTH_SESSION_PRIVATE_JWK,
  ]
  await request(
    `/auth/callback?code=${secrets[0]}&state=invalid-deployment-state`,
    { headers: { cookie: `oauth-pending=${secrets[1]}`, host: 'localhost' } },
  )
  await request('/auth/logout?client=portal', {
    body: secrets[2],
    headers: { host: 'localhost', origin: 'https://localhost' },
    method: 'POST',
  })

  const logs = compose('logs', '--no-color', 'caddy', 'auth', 'portal')
  for (const secret of secrets) assert.equal(logs.includes(secret), false)
})

test('the built Portal client bundle omits database credentials and signing secrets', () => {
  const secrets = [
    environment.DATABASE_PASSWORD,
    environment.AUTH_SESSION_PRIVATE_JWK,
  ]
  for (const secret of secrets) {
    assert.equal(
      clientBundleContainsSecret(secret),
      'not-found',
      `client bundle contains a secret value`,
    )
  }
})

test('operator command applies production database migrations', () => {
  assert.doesNotThrow(() =>
    compose('--profile', 'operations', 'run', '--rm', '--build', 'migrate'),
  )
})

test('every protected feature denies each actor without its current authority', async () => {
  database(`
    insert into clubs (id, short_name, full_name) values
      ('${ids.club}', 'SEC', 'Security Test Club');
    insert into members (id, email, display_name) values
      ('${ids.member}', 'member@example.test', 'Member'),
      ('${ids.boardMember}', 'board-member@example.test', 'Board Member'),
      ('${ids.administrator}', 'administrator@example.test', 'Administrator');
    insert into club_access (member_id, club_id) values ('${ids.member}', '${ids.club}');
    insert into board_members (member_id, board_position) values ('${ids.boardMember}', 'President');
    insert into administrators (member_id) values ('${ids.administrator}');
  `)

  const event = {
    address: '1 Security Way',
    description: 'Authorization boundary test event.',
    endAt: '2027-01-15T20:00',
    location: 'Test Room',
    owningClubId: ids.club,
    startAt: '2027-01-15T18:00',
    title: 'Security Test',
  }
  const cases = [
    [
      'Events',
      'createEventAction',
      'POST',
      event,
      ['anonymous', 'boardMember', 'administrator', 'superuser'],
    ],
    [
      'Resources',
      'createResourceAction',
      'POST',
      {
        category: 'operations',
        description: 'Security test resource',
        displayOrder: 0,
        title: 'Security Test',
        url: 'https://example.test/resource',
      },
      ['anonymous', 'member', 'boardMember'],
    ],
    [
      'Bookings',
      'createOwnBookingAction',
      'POST',
      {
        date: '2027-01-15',
        shiftSlotId: ids.missing,
      },
      ['anonymous', 'member', 'administrator', 'superuser'],
    ],
    [
      'Bookings override',
      'createOverrideBookingAction',
      'POST',
      {
        date: '2027-01-15',
        memberId: ids.boardMember,
        shiftSlotId: ids.missing,
      },
      ['anonymous', 'member', 'boardMember'],
    ],
    [
      'Members',
      'createMemberAction',
      'POST',
      {
        clubIds: [ids.club],
        displayName: 'Created Member',
        email: 'created-member@example.test',
      },
      ['anonymous', 'member', 'boardMember'],
    ],
    [
      'Clubs',
      'createClubAction',
      'POST',
      {
        fullName: 'Created Club',
        shortName: 'CRT',
        contactEmail: 'club@example.test',
      },
      ['anonymous', 'member', 'boardMember'],
    ],
    [
      'Board Members',
      'createBoardMemberAction',
      'POST',
      {
        boardPosition: 'Treasurer',
        displayName: 'Created Board Member',
        email: 'created-board@example.test',
      },
      ['anonymous', 'member', 'boardMember'],
    ],
    [
      'Audit',
      'getAuditHistory',
      'GET',
      { page: 1, pageSize: 25 },
      ['anonymous', 'member', 'boardMember'],
    ],
  ]

  for (const [feature, name, method, data, deniedActors] of cases) {
    for (const actor of deniedActors) {
      const response = await callServerFunction(
        name,
        method,
        data,
        actors[actor],
      )
      assert.equal(
        response.status,
        500,
        `${feature} admitted ${actor}: ${response.body}`,
      )
    }
  }
})

test('a current authorization change takes effect on the next request', async () => {
  const before = await callServerFunction(
    'getActiveResources',
    'GET',
    undefined,
    actors.member,
  )
  assert.equal(
    before.status,
    200,
    `${before.body}\n${compose('logs', '--no-color', 'portal')}`,
  )

  database(
    `update members set lifecycle = 'deactivated' where id = '${ids.member}'`,
  )

  const after = await callServerFunction(
    'getActiveResources',
    'GET',
    undefined,
    actors.member,
  )
  assert.equal(after.status, 500, after.body)
})

test('Portal rejects a cross-origin state-changing server function request', async () => {
  const response = await callServerFunction(
    'createResourceAction',
    'POST',
    {
      category: 'operations',
      description: 'Cross-origin security test',
      displayOrder: 0,
      title: 'Cross-origin test',
      url: 'https://example.test/resource',
    },
    actors.superuser,
    'https://evil.example',
  )

  assert.equal(
    response.status,
    403,
    `${response.body}\n${compose('logs', '--no-color', 'portal')}`,
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
