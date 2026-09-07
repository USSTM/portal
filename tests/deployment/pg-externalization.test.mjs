// Regression test for a Vite SSR-bundling defect that broke every database
// access reached through a server function.
//
// apps/portal/vite.config.ts builds two separate outputs: Nitro's main
// server entry (server/index.mjs) and a lazily-chunked "ssr" vite
// environment (server/chunks/build/*.mjs) used to resolve server functions
// and render routes. Without an explicit `ssr.external` list, Vite's SSR
// build externalizes `pg` for the main entry but INLINES/bundles pg's own
// CommonJS source into the ssr-environment chunks instead. That inlining
// goes through rolldown's CJS-to-ESM interop for pg-pool's default export
// and double-wraps it, so `pg`'s internal `class BoundPool extends Pool`
// throws `TypeError: Class extends value #<Object> is not a constructor or
// null` the moment that chunk is first imported - i.e. the first time any
// request reaches a server function that touches the database.
//
// This was masked for a long time by the (now-fixed, see
// ssr-self-request.test.mjs) SSR self-request loop bug: requests rarely got
// far enough to actually import the lazy chunk. Fixing that loop is what
// made this second, independent defect newly reachable in production.
//
// The fix is `ssr: { external: ['pg'] }` in apps/portal/vite.config.ts,
// which makes Vite's ssr-environment build externalize `pg` exactly like
// the main Nitro entry already does, for exactly the same reason ADR-0013
// forbids wrapping TanStack Start's own Node HTTP server: keep the
// production request path on the framework's own well-tested code paths
// rather than bundler-generated interop shims.
//
// This does not require Docker or a real database - the crash happens at
// module-import time, before any network I/O, so an unreachable
// DATABASE_URL is enough to isolate the bundling defect from a real
// connection failure.

import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { after, before, test } from 'node:test'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdir, readFile } from 'node:fs/promises'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const portalDir = join(repoRoot, 'apps/portal')
const port = 15900 + (process.pid % 900)

const environment = {
  ...process.env,
  // Deliberately unreachable: the bug reproduces at module-import time,
  // before any connection attempt, so this only needs to be well-formed.
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

test('a server function that touches the database does not crash on import', async () => {
  const functionId = await findServerFunctionId('getActiveResources')

  const response = await fetch(
    `http://127.0.0.1:${port}/_serverFn/${functionId}?payload=%7B%7D`,
    { headers: { accept: 'application/json', 'x-tsr-serverfn': 'true' } },
  )
  await response.text()

  // A 403 (rejected by the Origin/CSRF check, since this is a bare
  // unauthenticated request) or a 500 from a real failed DB connection are
  // both fine here - this test only cares that the module didn't crash on
  // import. See request-origin.ts and the module comment above.
  assert.ok(
    !serverLog.includes('Class extends value'),
    'the server function crashed while importing the database module - ' +
      'pg is being bundled into the ssr-environment chunk instead of ' +
      "externalized. Check apps/portal/vite.config.ts's `ssr.external` list.",
  )
})

async function findServerFunctionId(name) {
  const buildDir = join(portalDir, '.output/server/chunks/build')
  const pending = [buildDir]
  while (pending.length > 0) {
    const directory = pending.pop()
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        pending.push(path)
      } else if (entry.name.endsWith('.mjs')) {
        const source = await readFile(path, 'utf8')
        const match = new RegExp(
          `id: "([a-f0-9]{64})",\\s*name: "${name}"`,
        ).exec(source)
        if (match) return match[1]
      }
    }
  }
  throw new Error(`server function "${name}" not found in the build output`)
}

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
