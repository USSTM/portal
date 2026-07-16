# 13 — Expose the public Events API

**What to build:** The agreed stable, unauthenticated Event feed for external USSTM applications without adding a public Event page to the Portal.

**Blocked by:** 11 — Attribute Organizing Clubs

**Status:** ready-for-agent

- [ ] `GET /api/v1/events` returns the documented camelCase Event, Owning Club, and Organizing Club representation ordered by start time.
- [ ] Omitting bounds returns all past and future Events.
- [ ] Optional RFC 3339 `from` and `to` values use overlap semantics and invalid ranges return the documented `400` error envelope.
- [ ] `HEAD` returns matching status and headers without a body; mutation methods are not exposed.
- [ ] Responses allow credential-free CORS from any origin and use the agreed 60-second public cache policy.
- [ ] Personal creator, editor, Member, and Audit Entry data is never returned.
- [ ] The Portal contains no unauthenticated Event-listing page.
- [ ] Integration tests assert the published Markdown contract, ordering, overlap boundaries, errors, CORS, caching, and method behavior.

