# Add the Payload public website as a workspace app

The public USSTM website (Next.js + Payload CMS) lives in `apps/website` as `@usstm/website`. It was moved from `PACS-TMU/usstm-website@feat/rewrite` (single commit `1c82a5d`), so no history was carried over.

Payload owns a separate `usstm_website` database, with its own role, on the same PostgreSQL server as the Portal. This amends ADR-0009: the Portal still exclusively owns its database, and the website never reads or writes it. Payload schema changes ship as committed migrations in `apps/website/src/migrations`, and `website-migrate` applies them during deployment. Media stays in an S3-compatible bucket and is served through Payload at `/api/media/file/*`, so it stays same-origin.

The Portal remains the single source of truth for Events. The website renders them from `GET /api/v1/events` (ADR-0005), reaching the Portal container directly rather than going back through Caddy, and it shows an empty state if the Portal is unavailable. The website has no Events collection. Clubs, Board Members, Member Profiles, and Board Archives also move to the Portal, and Payload only builds Pages (ADR-0021).

Payload's own admin login is temporary. It will be replaced by the shared auth service, admitting only Content Managers (ADR-0020).

The website runs as its own Compose service behind Caddy on `WEBSITE_ADDRESS`, with its own CSP and request body limit. Pages render on demand, so building the image needs no database.
