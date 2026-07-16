# 07 — Designate Board Members

**What to build:** A focused Administration workflow for granting Board Member authority and maintaining the public Board Position attached to it.

**Blocked by:** 06 — Provision Members with Club Access

**Status:** ready-for-agent

- [ ] Administrators and the Superuser can grant Board Member authority with one required plain-text Board Position.
- [ ] A new Member may be provisioned with Board Member authority as their only initial grant.
- [ ] Administrators can change a non-administrator Board Member's display name and Board Position.
- [ ] Revoking Board Member authority removes that grant and deactivates the Member when it was their final grant.
- [ ] Ordinary Administrators cannot change Board Member data belonging to an Administrator.
- [ ] Board Member creation, profile changes, grant, and revocation create Audit Entries.
- [ ] Google profile names and photos are never used as Board Member data.
- [ ] Integration tests cover Board-only admission, required positions, final-grant deactivation, and authorization boundaries.

