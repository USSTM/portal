# 01 — Bootstrap the runnable workspace

**What to build:** A minimal workspace that runs the Portal, auth service, shared session package, and PostgreSQL locally and proves that every part can build and report health.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] The pnpm workspace contains independently runnable Portal and auth applications plus one narrowly scoped auth-session package.
- [x] Node.js 24 and the pnpm version are pinned, with one committed lockfile and no Turborepo or Nx dependency.
- [x] The Portal uses TanStack Start, TypeScript, Tailwind CSS, ShadCN defaults, and navy `#002956` as its primary color.
- [x] Local Docker Compose starts PostgreSQL with persistent development storage.
- [x] Drizzle connects through `node-postgres`, and committed SQL migrations apply successfully to an empty database.
- [x] Both applications expose liveness endpoints; the Portal also exposes database readiness.
- [x] Formatting, ESLint, typecheck, unit-test, integration-test, migration, and production-build commands are available from the workspace root.
- [x] CI executes the baseline checks and both production builds.
