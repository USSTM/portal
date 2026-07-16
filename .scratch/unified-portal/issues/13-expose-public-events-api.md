# 13 — Expose the public Events API

**What to build:** The agreed stable, unauthenticated Event feed for external USSTM applications without adding a public Event page to the Portal.

**Blocked by:** 11 — Attribute Organizing Clubs

**Status:** ready-for-agent

- [x] `GET /api/v1/events` returns the documented camelCase Event, Owning Club, and Organizing Club representation ordered by start time.
- [x] Omitting bounds returns all past and future Events.
- [x] Optional RFC 3339 `from` and `to` values use overlap semantics and invalid ranges return the documented `400` error envelope.
- [x] `HEAD` returns matching status and headers without a body; mutation methods are not exposed.
- [x] Responses allow credential-free CORS from any origin and use the agreed 60-second public cache policy.
- [x] Personal creator, editor, Member, and Audit Entry data is never returned.
- [x] The Portal contains no unauthenticated Event-listing page.
- [x] Integration tests assert the published Markdown contract, ordering, overlap boundaries, errors, CORS, caching, and method behavior.
