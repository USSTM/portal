# 03 — Let the Superuser provision Administrators

**What to build:** A Superuser-only workflow for creating and maintaining Administrator identities while preventing ordinary Administrators from changing protected Administrator records.

**Blocked by:** 02 — Sign in through shared Google authentication

**Status:** ready-for-agent

- [ ] Member and Administrator persistence uses stable Member IDs, normalized unique emails, display names, lifecycle state, and an explicit Administrator grant row.
- [ ] The Superuser can create an active Administrator with an initial Administrator grant in one transaction.
- [ ] The Superuser can edit, deactivate, reactivate, grant, or revoke Administrator authority.
- [ ] Ordinary Administrators cannot modify any field or grant belonging to an Administrator, including themselves.
- [ ] Active Administrators can sign in through the existing email admission check; deactivated Administrators are denied on their next request.
- [ ] Administrator mutations create immutable Audit Entries with actor, action, target, timestamp, and changed-value snapshot.
- [ ] The Superuser remains outside the Member tables and cannot be managed through this workflow.
- [ ] Integration tests cover Superuser authority, ordinary-Administrator denial, normalized-email uniqueness, and lifecycle transitions.

