# 04 — Browse privileged Audit History

**What to build:** A read-only Audit History page that lets Administrators and the Superuser inspect privileged changes without turning the log into a general activity feed.

**Blocked by:** 03 — Let the Superuser provision Administrators

**Status:** ready-for-agent

- [ ] Administrators and the Superuser can browse Audit Entries newest first with pagination.
- [ ] The page supports basic actor-email and action filtering through URL state.
- [ ] An entry shows actor email, action, target type and ID, timestamp, and an expandable changed-value snapshot.
- [ ] Audit Entries cannot be edited or deleted through the application.
- [ ] Non-administrator Members and anonymous visitors cannot access audit data.
- [ ] Unit and integration tests cover filtering, pagination, ordering, and authorization.

