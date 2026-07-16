# 18 — Import legacy Clubs and Events

**What to build:** A repeatable migration command that converts the approved legacy Portal export into the new Club and Event model and proves the result before cutover.

**Blocked by:** 11 — Attribute Organizing Clubs

**Status:** ready-for-agent

- [ ] The import accepts legacy Clubs, Events, and organizer relationships without depending on the live legacy application.
- [ ] Legacy Club and Event UUIDs are preserved.
- [ ] Legacy group-account records become Clubs, and `created_by` becomes the Owning Club relationship.
- [ ] Organizer rows become additional Organizing Clubs after duplicate-owner relationships are removed.
- [ ] All past and future Events, timestamps, public fields, and relationships are retained.
- [ ] Credentials, authentication identities, password state, sessions, Board rosters, and Office Hours Bookings are excluded.
- [ ] Re-running the same import is idempotent and does not duplicate data.
- [ ] The command reports and verifies record counts, IDs, relationships, invalid references, and timestamp conversion.
- [ ] Integration fixtures cover representative same-owner, multi-organizer, past, future, and invalid-source cases.

