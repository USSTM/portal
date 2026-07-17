# 18 — Import legacy Clubs and Events

**What to build:** A repeatable migration command that converts the approved legacy Portal export into the new Club and Event model and proves the result before cutover.

**Blocked by:** 11 — Attribute Organizing Clubs

**Status:** ready-for-agent

- [x] The import accepts legacy Clubs, Events, and organizer relationships without depending on the live legacy application.
- [x] Legacy Club and Event UUIDs are preserved.
- [x] Legacy group-account records become Clubs, and `created_by` becomes the Owning Club relationship.
- [x] Organizer rows become additional Organizing Clubs after duplicate-owner relationships are removed.
- [x] All past and future Events, timestamps, public fields, and relationships are retained.
- [x] Credentials, authentication identities, password state, sessions, Board rosters, and Office Hours Bookings are excluded.
- [x] Re-running the same import is idempotent and does not duplicate data.
- [x] The command reports and verifies record counts, IDs, relationships, invalid references, and timestamp conversion.
- [x] Integration fixtures cover representative same-owner, multi-organizer, past, future, and invalid-source cases.
