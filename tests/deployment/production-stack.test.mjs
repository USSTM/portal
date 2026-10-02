import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

const websiteEnvironment = {
  PAYLOAD_SECRET: 'deployment-test-payload-secret',
  S3_ACCESS_KEY_ID: 'deployment-test',
  S3_BUCKET: 'usstm-website-media',
  S3_ENDPOINT: 'https://s3.example.test',
  S3_REGION: 'ca-central-1',
  S3_SECRET_ACCESS_KEY: 'deployment-test',
  WEBSITE_ADDRESS: 'example.test',
  WEBSITE_DATABASE_NAME: 'usstm_website',
  WEBSITE_DATABASE_PASSWORD: 'secret',
  WEBSITE_DATABASE_URI:
    'postgresql://usstm_website:secret@postgres:5432/usstm_website',
  WEBSITE_DATABASE_USER: 'usstm_website',
}

function productionConfig() {
  const output = execFileSync(
    'docker',
    [
      'compose',
      '-f',
      'compose.production.yaml',
      '--profile',
      'operations',
      'config',
      '--format',
      'json',
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        AUTH_CLIENTS: '[]',
        AUTH_SESSION_ISSUER: 'usstm-auth',
        AUTH_SESSION_KEY_ID: 'current',
        AUTH_SESSION_PRIVATE_JWK: '{}',
        DATABASE_NAME: 'usstm_portal',
        DATABASE_PASSWORD: 'secret',
        DATABASE_USER: 'usstm',
        DATABASE_URL: 'postgresql://usstm:secret@postgres:5432/usstm_portal',
        PORTAL_ADDRESS: 'portal.example.test',
        PORTAL_AUTH_ISSUER: 'usstm-auth',
        PORTAL_AUTH_KEY_ID: 'current',
        PORTAL_AUTH_PUBLIC_JWK: '{}',
        PORTAL_CONTACT_EMAIL: 'info@example.test',
        PORTAL_CONTACT_INSTAGRAM: 'https://instagram.com/example',
        PORTAL_CONTACT_LINKTREE: 'https://linktr.ee/example',
        PORTAL_CONTACT_WEBSITE: 'https://example.test',
        PORTAL_SUPERUSER_EMAIL: 'admin@example.test',
        RESTIC_PASSWORD: 'deployment-test-encryption-key',
        RESTIC_REPOSITORY: 's3:s3.example.test/usstm-backups',
        ...websiteEnvironment,
      },
    },
  )
  return JSON.parse(output)
}

test('production stack operates the public proxy, Portal, auth, and database separately', () => {
  const config = productionConfig()
  const { auth, caddy, portal, postgres } = config.services

  assert.ok(auth)
  assert.ok(caddy)
  assert.ok(portal)
  assert.ok(postgres)

  assert.deepEqual(Object.keys(caddy.ports).sort(), ['0', '1'])
  assert.equal(auth.ports, undefined)
  assert.equal(portal.ports, undefined)
  assert.equal(postgres.ports, undefined)

  assert.equal(auth.restart, 'unless-stopped')
  assert.equal(caddy.restart, 'unless-stopped')
  assert.equal(portal.restart, 'unless-stopped')
  assert.equal(postgres.restart, 'unless-stopped')
  assert.ok(auth.healthcheck)
  assert.ok(caddy.healthcheck)
  assert.ok(portal.healthcheck)
  assert.ok(postgres.healthcheck)

  const databaseMount = postgres.volumes.find(
    (volume) => volume.target === '/var/lib/postgresql/data',
  )
  assert.equal(databaseMount.type, 'volume')
  assert.ok(config.volumes[databaseMount.source])

  assert.deepEqual(Object.keys(postgres.networks), ['database'])
  assert.deepEqual(Object.keys(auth.networks), ['application'])
  assert.deepEqual(Object.keys(portal.networks).sort(), [
    'application',
    'database',
  ])
  assert.deepEqual(Object.keys(caddy.networks), ['application'])
  assert.equal(config.networks.database.internal, true)

  assert.equal(config.services.backup.command.join(' '), 'crond -f -l 2')
  assert.deepEqual(Object.keys(config.services.backup.networks).sort(), [
    'backup-egress',
    'database',
  ])
  assert.equal(config.services.migrate.build.target, 'migrate')
  assert.deepEqual(config.services.migrate.profiles, ['operations'])
})

test('production stack runs the website beside the Portal with its own migrations', () => {
  const config = productionConfig()
  const { postgres, website } = config.services

  assert.ok(website)
  assert.equal(website.ports, undefined)
  assert.equal(website.restart, 'unless-stopped')
  assert.ok(website.healthcheck)
  assert.deepEqual(Object.keys(website.networks).sort(), [
    'application',
    'database',
  ])
  // Payload owns its own database, never the Portal's.
  assert.match(website.environment.DATABASE_URI, /\/usstm_website$/)
  assert.ok(
    postgres.volumes.some(
      (volume) => volume.target === '/docker-entrypoint-initdb.d',
    ),
  )

  assert.equal(config.services['website-migrate'].build.target, 'migrate')
  assert.deepEqual(config.services['website-migrate'].profiles, ['operations'])
})
