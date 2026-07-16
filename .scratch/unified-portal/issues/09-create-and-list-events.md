# 09 — Create and list Club Events

**What to build:** A Club-authorized Event workflow that creates immediately public Event records and lets Members browse their Clubs' upcoming and historical work.

**Blocked by:** 06 — Provision Members with Club Access

**Status:** ready-for-agent

- [ ] A Member with Club Access can create an Event for an explicitly selected authorized Owning Club.
- [ ] Event input enforces the agreed title, description, location, address, Toronto date/time, and minimum-duration rules on both client and server.
- [ ] Event creation stores stable identity, Owning Club, creator attribution, timestamps, and no draft state.
- [ ] Members cannot create Events for archived or unauthorized Clubs.
- [ ] Upcoming includes ongoing and future Events ordered by start; Past contains completed Events ordered by end descending.
- [ ] One server-driven search covers Event text and Club names, with URL state and 20-item pagination.
- [ ] The UI clearly labels the Owning Club and uses no global active-Club selector.
- [ ] Unit and integration tests cover validation, Toronto-time classification, ownership authorization, search, and pagination.

