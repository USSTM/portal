# 11 — Add Board Archives

**What to build:** Let Administrators freeze the current board into a Board Archive for an academic year, import past boards in the same form, and expose archives publicly.

**Blocked by:** 10 — Expose the current board through a public API

**Status:** ready-for-agent

- [ ] An Administrator action creates a Board Archive for a named academic year from the current Board Members' display names and Board Positions. It is audited.
- [ ] Board Archives store names and Board Positions only, with no Member references and no photos.
- [ ] There is at most one Board Archive per academic year, and archives cannot be edited afterwards (except by re-import, if one is defined).
- [ ] A legacy import loads the Website's BoardHistory into Board Archives in the same format.
- [ ] `GET /api/v1/board-archives` returns the archives newest first, documented in `docs/api/board-archives.md`.
