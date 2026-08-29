# 19 — Build the production deployment stack

**What to build:** A single-host production stack that exposes only Caddy while running the Portal, reusable auth service, and PostgreSQL as separately operated services.

**Blocked by:** 02 — Sign in through shared Google authentication

**Status:** resolved

- [x] Production Docker Compose runs Caddy, the Nitro-built Portal, Hono auth service, and PostgreSQL as separate services.
- [x] Caddy terminates TLS, routes the Portal, and reverse-proxies `/auth/*` without exposing auth or PostgreSQL directly.
- [x] PostgreSQL uses persistent storage and a private application connection.
- [x] Required environment configuration is validated at startup without exposing secrets to client bundles.
- [x] Both services emit structured JSON logs and propagate a request ID from Caddy.
- [x] Liveness, Portal database readiness, and Docker restart policies support routine failure recovery.
- [x] Nightly PostgreSQL backups are encrypted and copied to configurable off-host storage.
- [x] Production setup documentation covers configuration, startup, migration application, health checks, backup execution, and routine restart.

## Comments

- Implemented the single-host production stack with Node 24 multi-stage images, Caddy-managed TLS, private application/database networks, health checks, request-correlated JSON logs, an operations-only migration command, and a nightly restic backup scheduler.
- Added deployment contract and live-stack integration coverage. The live test builds the images and verifies public routing, request-ID propagation, structured logs, migration execution, and an encrypted PostgreSQL snapshot through operator-facing commands.
- Added `deployment/production.env.example` and `docs/production-deployment.md` as the production configuration template and operations runbook.
