# 02 — Make `main` pass typecheck and format

**What to build:** Clear the failures that are already on `main` and keep CI red no matter what changes: 12 Portal type errors and 40 files that fail `prettier --check`.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] The parameters in `apps/portal/server/request-logging.ts` are typed, so there are no implicit `any`s.
- [ ] `apps/portal/src/migrations/legacy/import.ts` and its integration test narrow `string | undefined` instead of passing it to Drizzle `inArray`, with no behaviour change.
- [ ] `pnpm format:write` runs once as its own change; `pnpm format` passes.
- [ ] `pnpm typecheck` passes across the workspace.
