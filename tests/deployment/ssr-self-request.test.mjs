// Regression test for the Nitro production-build defect that turned every
// page load into an unbounded self-request loop: nitro-nightly's
// `virtual()` rollup plugin returned an unmarked module id for the
// `#nitro-internal-pollyfills` virtual, so rolldown tree-shook it away as
// pure. That silently dropped the `setupVite()` shim that intercepts
// `fetch(req, { viteEnv: "ssr" })`, so Nitro's catch-all SSR route fell
// through to a real network request against the server's own origin -
// recursing on itself with no bound until the process fell over. See the
// pinned patch at patches/nitro-nightly@4.0.0-20251010-091516-7cafddba.patch
// and the static build check in apps/portal/scripts/check-ssr-shim.mjs.
//
// Unlike that static check, this test boots the actual built server and
// exercises it, so it also catches the loop reappearing for a different
// reason (a future Nitro version, a different tree-shaking edge case, an
// application-level self-fetch) that the narrow static check wouldn't name.
//
// This does not require Docker or a database - it runs directly against
// apps/portal/.output, which it (re)builds fresh in `before`.

import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { after, before, test } from 'node:test'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const portalDir = join(repoRoot, 'apps/portal')
const port = 13000 + (process.pid % 1000)

const environment = {
  ...process.env,
  DATABASE_URL: 'postgresql://usstm:usstm@127.0.0.1:1/unreachable',
  HOST: '127.0.0.1',
  NODE_ENV: 'production',
  PORT: String(port),
  PORTAL_AUTH_ISSUER: 'usstm-auth',
  PORTAL_AUTH_KEY_ID: 'deployment-test',
  PORTAL_AUTH_PUBLIC_JWK: '{}',
  PORTAL_CONTACT_EMAIL: 'info@example.test',
  PORTAL_CONTACT_INSTAGRAM: 'https://instagram.com/example',
  PORTAL_CONTACT_LINKTREE: 'https://linktr.ee/example',
  PORTAL_CONTACT_WEBSITE: 'https://example.test',
  PORTAL_SUPERUSER_EMAIL: 'admin@example.test',
}

let server
let serverLog = ''

before(async () => {
  // Rebuilds apps/portal, which also runs the check-ssr-shim postbuild
  // guard - a broken build fails here before the server ever boots.
  execFileSync('pnpm', ['--filter', '@usstm/portal', 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  server = spawn('node', ['server/index.mjs'], {
    cwd: join(portalDir, '.output'),
    env: environment,
  })
  server.stdout.on('data', (chunk) => (serverLog += chunk.toString()))
  server.stderr.on('data', (chunk) => (serverLog += chunk.toString()))

  await waitForServer()
})

after(() => {
  server?.kill()
})

test('a single page request does not recursively self-fetch', async () => {
  await fetch(`http://127.0.0.1:${port}/`).catch(() => {})

  // Give any (bugged) recursive self-requests time to complete and flush
  // their request-logging.ts log lines before counting them. A looping
  // build produces tens of thousands of these within a couple of seconds.
  await sleep(2000)

  const selfRequests = serverLog
    .split('\n')
    .filter((line) => line.includes('"path":"/"')).length

  assert.equal(
    selfRequests,
    1,
    `expected exactly one logged request for "/", got ${selfRequests}. ` +
      'This is the signature of the Nitro SSR self-request loop bug ' +
      '(patches/nitro-nightly@4.0.0-20251010-091516-7cafddba.patch) ' +
      'reasserting itself.',
  )
})

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health/live`)
      if (response.ok) return
    } catch {
      // Not listening yet.
    }
    await sleep(100)
  }
  throw new Error(
    `portal server did not start listening on port ${port} within ${timeoutMs}ms:\n${serverLog}`,
  )
}
