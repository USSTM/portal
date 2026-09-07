#!/usr/bin/env node
// Guards against a Nitro production-build defect that shipped an infinite
// self-request loop: nitro-nightly's `virtual()` rollup plugin returns an
// unmarked module id for the `#nitro-internal-pollyfills` virtual, so
// rolldown tree-shakes it away as pure. That silently drops the
// `setupVite()` shim that intercepts `fetch(req, { viteEnv: "ssr" })` calls
// and routes them in-process. Without the shim, Nitro's catch-all route
// still calls that same `fetch(...)`, which falls through to a real network
// request against the server's own public origin — every page load
// recursively re-enters itself. See the pinned patch at
// patches/nitro-nightly@4.0.0-20251010-091516-7cafddba.patch.
//
// This check only asserts the specific, known-broken signature: if the
// bundle doesn't route through Nitro's internal viteEnv service dispatch at
// all, there's nothing here for it to validate.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const bundlePath = fileURLToPath(
  new URL('../.output/server/index.mjs', import.meta.url),
)

let bundle
try {
  bundle = readFileSync(bundlePath, 'utf8')
} catch (error) {
  console.error(`check-ssr-shim: could not read ${bundlePath}`)
  console.error(error.message)
  process.exit(1)
}

const usesViteSsrService = bundle.includes('viteEnv: "ssr"')
const hasProductionShim = bundle.includes('setupVite')

if (usesViteSsrService && !hasProductionShim) {
  console.error(
    'check-ssr-shim: the production bundle routes SSR through ' +
      '`fetch(req, { viteEnv: "ssr" })` but does not contain the ' +
      '`setupVite` shim that intercepts it in-process.\n\n' +
      'Every page load will instead make a real outbound HTTP request to ' +
      "the server's own public origin, recursing until the process falls " +
      'over (see the nitro-nightly patch in patches/ and its notes in ' +
      'docs/adr/).\n\n' +
      'Most likely cause: the nitro-nightly dependency was changed/upgraded ' +
      'and no longer resolves to the patched version, or ' +
      '`pnpm.patchedDependencies` in pnpm-workspace.yaml stopped applying.',
  )
  process.exit(1)
}

console.log('check-ssr-shim: production SSR self-request shim is present.')
