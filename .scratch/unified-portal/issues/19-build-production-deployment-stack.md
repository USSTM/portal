# 19 — Build the production deployment stack

**What to build:** A single-host production stack that exposes only Caddy while running the Portal, reusable auth service, and PostgreSQL as separately operated services.

**Blocked by:** 02 — Sign in through shared Google authentication

**Status:** ready-for-agent

- [ ] Production Docker Compose runs Caddy, the Nitro-built Portal, Hono auth service, and PostgreSQL as separate services.
- [ ] Caddy terminates TLS, routes the Portal, and reverse-proxies `/auth/*` without exposing auth or PostgreSQL directly.
- [ ] PostgreSQL uses persistent storage and a private application connection.
- [ ] Required environment configuration is validated at startup without exposing secrets to client bundles.
- [ ] Both services emit structured JSON logs and propagate a request ID from Caddy.
- [ ] Liveness, Portal database readiness, and Docker restart policies support routine failure recovery.
- [ ] Nightly PostgreSQL backups are encrypted and copied to configurable off-host storage.
- [ ] Production setup documentation covers configuration, startup, migration application, health checks, backup execution, and routine restart.

