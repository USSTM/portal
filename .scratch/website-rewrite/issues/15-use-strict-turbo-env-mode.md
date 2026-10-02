# 15 — Use strict Turbo environment mode

**What to build:** Move `turbo.json` from `envMode: loose` to `strict`, so that undeclared environment variables can never leak into a cached task.

**Blocked by:** None — can start immediately

**Status:** needs-triage

- [ ] Every variable each task reads is declared in `env`, `globalEnv` or `passThroughEnv`.
- [ ] `pnpm turbo run lint typecheck test test:integration build` passes in strict mode locally and in CI.
- [ ] ADR-0019 is updated to remove the note about loose mode.
