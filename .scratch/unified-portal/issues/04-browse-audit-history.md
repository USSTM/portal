# 04 — Browse privileged Audit History

**What to build:** A read-only Audit History page that lets Administrators and the Superuser inspect privileged changes without turning the log into a general activity feed.

**Blocked by:** 03 — Let the Superuser provision Administrators

**Status:** resolved

- [x] Administrators and the Superuser can browse Audit Entries newest first with pagination.
- [x] The page supports basic actor-email and action filtering through URL state.
- [x] An entry shows actor email, action, target type and ID, timestamp, and an expandable changed-value snapshot.
- [x] Audit Entries cannot be edited or deleted through the application.
- [x] Non-administrator Members and anonymous visitors cannot access audit data.
- [x] Unit and integration tests cover filtering, pagination, ordering, and authorization.
