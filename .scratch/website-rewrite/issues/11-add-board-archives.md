# 11 — Add Board Archives

**What to build:** Let Administrators freeze the current board into a Board Archive for an academic year, import past boards in the same form, and expose archives publicly.

**Blocked by:** 10 — Expose the current board through a public API

**Status:** ready-for-human

- [x] An Administrator action creates a Board Archive for a named academic year from the current Board Members' display names and Board Positions. It is audited.
- [x] Board Archives store names and Board Positions only, with no Member references and no photos.
- [x] There is at most one Board Archive per academic year, and archives cannot be edited afterwards (except by re-import, if one is defined).
- [x] A legacy import loads the Website's BoardHistory into Board Archives in the same format.
- [x] `GET /api/v1/board-archives` returns the archives newest first, documented in `docs/api/board-archives.md`.

## Comments

- Tables (migration `0019`): `board_archives` (unique `academic_year` in `YYYY-YYYY` form with consecutive years, and a `source` of `portal` or `legacy_import`) and `board_archive_entries` (ordered display names and Board Positions, with no Member reference).
- Immutability (custom migration `0020`): triggers reject every `UPDATE` and `DELETE` on both tables. `TRUNCATE` is still allowed so test databases can be reset. No re-import is defined: an import skips years that already have an archive.
- **Archive current board** on the Board Members page snapshots the current board in its Website order (ticket 10), after a confirmation. It accepts `2025-2026`, `2025/2026` or `2025-26`, and is audited as `board_archive.created`.
- Legacy import: the Website's `export:board-history` flattens each BoardHistory year's groups of People into names and positions, using a person's `position` or, when blank, the group name, and lists people it could not export. The Portal's `db:import-board-archives` prints a dry run, and with `--apply` creates the archives as the Superuser (`board_archive.imported`). Runbook: "BoardHistory into Board Archives" in `docs/production-deployment.md`. Ticket 08's Compose override is now `deployment/compose.website-data-copy.yaml` and serves both copies.
- Ticket 12 removes BoardHistory with a migration that first keeps every year in `board_history_archive`, and the export reads that table, so the copy can run after the removal is deployed.
- Needs a human:
  - Apply migrations `0019` and `0020`.
  - Run `board-archives.integration.test.ts` (no Docker where this was built).
  - Run the legacy import against production, dry run first.
  - Check the Board Archives card on the Board Members page in a browser.
