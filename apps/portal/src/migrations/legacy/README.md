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
