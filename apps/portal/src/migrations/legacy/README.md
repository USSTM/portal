# Legacy Club and Event import

Import reads three JSON arrays exported from legacy Supabase database:

- `users.json`: legacy group accounts, converted to active Clubs.
- `events.json`: all past and future Events.
- `organizers.json`: Event-to-group relationships.

Keep production exports in `.scratch/legacy-export/`. Directory is ignored by Git
because files contain production contact and Event data. Do not export credentials,
authentication identities, sessions, Board rosters, or Office Hours data.

From repository root, validate without writing:

```sh
pnpm --filter @usstm/portal db:import-legacy --source .scratch/legacy-export
```

Apply validated import to database selected by `DATABASE_URL`:

```sh
pnpm --filter @usstm/portal db:import-legacy \
  --source .scratch/legacy-export --apply
```

Dry-run is default. Report includes preserved ID sets, retained relationships, source
and converted timestamp pairs, and invalid-reference details. Apply mode validates
full source before starting transaction.
Preserved Club and Event UUIDs make repeated identical imports no-ops. Existing rows
with same UUID but different migration-owned values abort import and roll back new rows.

Cutover sequence:

1. Disable legacy Event changes.
2. Export fresh `users`, `events`, and `organizers` JSON files.
3. Back up target PostgreSQL database.
4. Run dry-run and review counts and rejected relationships.
5. Run apply mode once.
6. Run apply mode again and confirm every database count reports as `existing`.
7. Verify public Events API before opening new Portal.

## Test and local dev databases

Automated tests never import from `.scratch/legacy-export/` (real, gitignored, contains
PII). They use the checked-in `fixtures/representative/` directory instead — three fake
Clubs with `@example.com` contacts, structurally identical to a real export.

Integration tests run against a dedicated test database, never the interactive dev
database:

```sh
pnpm db:test:up       # start the postgres-test container (once)
pnpm db:test:migrate   # apply schema migrations to it
pnpm db:test:reset     # truncate + reseed with representative fixtures and baseline Resources
pnpm test:integration
```

`pnpm test:integration` always points at `.env.test`'s `DATABASE_URL`, regardless of what
`.env.local` has set, and each test truncates all tables before it runs
(`src/db/integration-test-setup.ts`) — `db:test:reset` is a convenience for getting a
browsable baseline, not a prerequisite for the suite to pass.

The curated `resources` rows (Finance/Operations forms) are not part of the legacy export —
they're tracked separately in `src/db/seed/resources.json` and applied by
`src/db/seed/import-resources.ts`, which `db:test:reset` also runs.
