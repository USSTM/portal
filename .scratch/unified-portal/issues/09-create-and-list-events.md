# 09 — Create and list Club Events

**What to build:** A Club-authorized Event workflow that creates immediately public Event records and lets Members browse their Clubs' upcoming and historical work.

**Blocked by:** 06 — Provision Members with Club Access

**Status:** resolved

- [x] A Member with Club Access can create an Event for an explicitly selected authorized Owning Club.
- [x] Event input enforces the agreed title, description, location, address, Toronto date/time, and minimum-duration rules on both client and server.
- [x] Event creation stores stable identity, Owning Club, creator attribution, timestamps, and no draft state.
- [x] Members cannot create Events for archived or unauthorized Clubs.
- [x] Upcoming includes ongoing and future Events ordered by start; Past contains completed Events ordered by end descending.
- [x] One server-driven search covers Event text and Club names, with URL state and 20-item pagination.
- [x] The UI clearly labels the Owning Club and uses no global active-Club selector.
- [x] Unit and integration tests cover validation, Toronto-time classification, ownership authorization, search, and pagination.
