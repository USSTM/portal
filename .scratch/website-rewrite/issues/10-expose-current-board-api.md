# 10 — Expose the current board through a public API

**What to build:** Publish the current board, meaning Board Members with their Board Positions and public Member Profiles, for the Website.

**Blocked by:** 09 — Add Member Profiles

**Status:** ready-for-agent

- [ ] `GET /api/v1/board` returns each current Board Member's display name, Board Position, and Member Profile photo and bio.
- [ ] Only Board Members appear; no email or other personal data is returned.
- [ ] Board ordering is defined (an Administrator-set order, or a documented rule).
- [ ] The contract is documented in `docs/api/board.md` and follows the Events API conventions.
