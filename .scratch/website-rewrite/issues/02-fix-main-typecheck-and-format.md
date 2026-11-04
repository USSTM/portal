# 02 — Make `main` pass typecheck and format

**What to build:** Clear the failures that are already on `main` and keep CI red no matter what changes: 12 Portal type errors and 40 files that fail `prettier --check`.

**Blocked by:** None — can start immediately

**Status:** resolved

- [x] The parameters in `apps/portal/server/request-logging.ts` are typed, so there are no implicit `any`s.
- [x] `apps/portal/src/migrations/legacy/import.ts` and its integration test narrow `string | undefined` instead of passing it to Drizzle `inArray`, with no behaviour change.
- [x] `pnpm format:write` runs once as its own change; `pnpm format` passes.
- [x] `pnpm typecheck` passes across the workspace.

## Comments

- The import errors came from `$inferInsert` making `id` optional. `PreparedClub` and `PreparedEvent` now require `id: string`, which fixes `import.ts` and its integration test without touching either call site.
- 41 files needed formatting. On a Windows checkout with `core.autocrlf=true`, `pnpm format` also flags about 220 CRLF-only files that Git stores as LF. Those are local only, so the write used `--end-of-line auto`. A `.gitattributes` with `* text=auto eol=lf` would make `pnpm format` work on Windows.
- The legacy import integration test was not run (no database available).
