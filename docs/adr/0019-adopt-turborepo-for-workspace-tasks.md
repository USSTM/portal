# Adopt Turborepo for workspace tasks

This supersedes the "Turborepo is excluded" part of ADR-0012. Everything else in ADR-0012 stands: one pnpm workspace and lockfile, no generic core packages, no speculative shared abstractions.

Adding the Next.js website made `build` the expensive task. Every PR re-ran every app's lint, typecheck, test and build. Root scripts now go through `turbo run`. Turbo caches task results by content hash, runs independent tasks in parallel, and orders them by workspace dependencies. Pull request CI adds `--affected`, and the local `.turbo/cache` persists in the GitHub Actions cache. There is no hosted remote cache.

`turbo.json` declares each task's outputs. Environment variables that change build output go in `env`. Integration tests are never cached because they depend on a live database. The website image uses `turbo prune` to install only its own dependency graph. The Portal and auth images keep their existing pattern because of the pinned Nitro patch (ADR-0017).

`envMode` is `loose` for now. Moving to `strict` requires declaring every variable each task reads.
