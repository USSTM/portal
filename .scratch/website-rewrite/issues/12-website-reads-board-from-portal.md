# 12 — Read the board and Board Archives from the Portal on the Website

**What to build:** Replace the Website's People and BoardHistory collections with the Portal board and Board Archive endpoints.

**Blocked by:** 10 — Expose the current board through a public API; 11 — Add Board Archives

**Status:** ready-for-agent

- [ ] The team block renders the current board from `GET /api/v1/board`.
- [ ] A past-boards block renders Board Archives.
- [ ] The People and BoardHistory collections are removed with a migration, and Pages using them are switched over.
- [ ] The Website shows an empty state when the Portal is unavailable.
