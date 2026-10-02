# 01 — Move the Website into the monorepo

**What to build:** Bring the Payload website rewrite (the single commit `1c82a5d` on `PACS-TMU/usstm-website@feat/rewrite`) into `apps/website` and adopt Turborepo for workspace tasks.

**Blocked by:** None — can start immediately

**Status:** resolved

- [x] `@usstm/website` installs with pnpm, using exact versions on Node 24 (Payload 3.90.2, Next 15.4.11).
- [x] The Payload Events collection is removed; the events block reads `GET /api/v1/events` and shows an empty state when the Portal is unavailable.
- [x] Payload owns a separate `usstm_website` database with a committed baseline migration; `website-migrate` runs in `deploy.sh`.
- [x] Pages render on demand, so `next build` needs no database; `/health/live` touches no database.
- [x] The `website` Compose service runs behind its own Caddy site block, CSP and 25MB body limit; nightly backups cover both databases.
- [x] The website image builds with `turbo prune`.
- [x] Root scripts run through Turborepo; pull-request CI uses `--affected` and caches `.turbo/cache`.
- [x] ADR-0018 and ADR-0019 are recorded, and the README, deployment guide and deployment tests are updated.
