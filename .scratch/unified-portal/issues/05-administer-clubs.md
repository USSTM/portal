# 05 — Administer Clubs

**What to build:** A simple Administration workflow for maintaining Clubs without deleting the organizational history attached to them.

**Blocked by:** 03 — Let the Superuser provision Administrators

**Status:** resolved

- [x] Administrators and the Superuser can create and edit a Club's unique short name, full name, and optional contact email.
- [x] Clubs can be searched and filtered by active or archived state.
- [x] Archiving a Club revokes its Club Access grants transactionally and prevents new grants or new Event participation.
- [x] Archived Clubs remain stored and can be reactivated without restoring old grants.
- [x] The application offers no hard-delete operation for Clubs.
- [x] Club creation, edits, archive, and reactivation create Audit Entries.
- [x] Server-side validation and database constraints enforce stable IDs, required names, and short-name uniqueness.
- [x] Integration tests cover lifecycle behavior, audit creation, and authorization.
