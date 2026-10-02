# @usstm/website

The public USSTM website: Next.js 15 plus Payload CMS 3 (admin at `/admin`), Tailwind CSS v4, and shadcn/ui.

- **Content:** Payload collections in `src/collections`, stored in the Payload-owned `usstm_website` database (ADR-0018).
- **Events:** read from the Portal's public API (`src/lib/portal-events.ts`, `docs/api/events.md`). This app never stores Events.
- **Media:** an S3-compatible bucket served through Payload.

## Development

```sh
cp .env.example .env          # set DATABASE_URI to match POSTGRES_PORT
pnpm db:up && pnpm db:migrate # from the repo root
pnpm --filter @usstm/website dev
```

After changing a collection or global:

```sh
pnpm --filter @usstm/website generate:types
pnpm --filter @usstm/website generate:importmap   # when admin components change
pnpm --filter @usstm/website migrate:create <name>
```

Commit `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`, and the new migration.

## Tests

- `test`: unit tests (`tests/unit`)
- `test:integration`: Payload against a real database (`tests/int`)
- `test:e2e`: Playwright against the dev server
