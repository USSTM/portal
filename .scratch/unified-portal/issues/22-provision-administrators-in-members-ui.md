# 22 — Provision Administrators in the Members UI

**What to build:** Let the Superuser create, grant, and manage Administrators from the Members page instead of an unwired backend, and make existing Administrators visible there as ordinary Members holding an Administrator grant. Introduces the protected USSTM Club as the Club every Administrator holds access to.

**Blocked by:** 03 — Let the Superuser provision Administrators; 06 — Provision Members with Club Access

**Status:** ready-for-agent

- [ ] Seed a single protected Club representing USSTM, with a fixed id, created by migration ahead of the legacy import. Protection is a `clubs.protected` column, not a name match.
- [ ] The USSTM Club can never be archived, renamed, or hard-deleted through `/admin/clubs`; its row renders read-only there. It can own Events and be attributed as an organizing Club like any active Club.
- [ ] `browseMembers` gains an `includeAdministrators` flag (default off, preserving today's behavior for `/admin/board-members`) and returns whether each Member holds the Administrator grant. The Members page passes it on.
- [ ] Administrators appear in the Members list as ordinary rows with an `Administrator` badge alongside their Club Access and Board Member badges. The Administrator filter option is added to the existing grant filter.
- [ ] One Member-creation path accepts a display name, normalized unique email, and any combination of an Administrator grant, one or more Club Access grants, and Board Member authority with a required Board Position — replacing the separate "at least one Club" rule with "at least one grant." Creating with the Administrator grant also grants USSTM Club Access in the same transaction and writes an `administrator.created` Audit Entry; otherwise it writes `member.created`.
- [ ] The Add Member form exposes an Administrator checkbox, visible only to the Superuser.
- [ ] Before creating, check whether the email already belongs to a Member and fail with a specific message directing the Superuser to that Member's row menu, instead of surfacing the raw uniqueness violation.
- [ ] Any mutation targeting a Member who currently holds the Administrator grant (edit, Club Access grant/revoke, Board Member grant/update/revoke, deactivate, reactivate) is Superuser-only. Ordinary Administrators see these rows in the list with no action menu.
- [ ] The Superuser's row menu for an Administrator includes: edit (with the same email-change confirmation `editMember` requires), Club Access grant/revoke, grant/revoke Administrator, grant/update/revoke Board Member authority, and deactivate/reactivate.
- [ ] Granting Administrator to an existing active Member inserts USSTM Club Access if the Member doesn't already hold it; existing grants are untouched.
- [ ] While a Member holds the Administrator grant, their USSTM Club Access chip has no remove control. Any Administrator, including ordinary ones, can still grant or revoke USSTM Club Access on Members who are not Administrators.
- [ ] Revoking the Administrator grant removes only that grant. It never deactivates the Member and never touches their USSTM or other Club Access — deactivation only ever follows from revoking a Member's last remaining grant.
- [ ] Deactivating an Administrator strips every grant they hold (Administrator, all Club Access, Board Member), cancels their future Bookings, and removes them from the public Office Hours calendar, using the same path `deactivateMember` uses for non-administrators.
- [ ] Reactivating any Member who has ever held the Administrator grant (per Audit Entries with an `administrator.*` action) is Superuser-only and requires assigning at least one new grant, same as today's reactivation rule.
- [ ] The Superuser may revoke or deactivate the last remaining Administrator; no guard prevents zero Administrators from existing.
- [ ] The Superuser's deployment-configured email is never listed on the Members page in any form.
- [ ] Integration tests cover: unified creation with each grant combination, the USSTM auto-grant and its removal-locked chip, revoke-vs-deactivate distinct outcomes, deactivation cascading Bookings and grants, Superuser-only enforcement on Administrator-held records, ordinary-Administrator access to USSTM like any other Club, and reactivation gated by administrator history.

## Comments

Captured via `/grill-with-docs`. See ADR-0016 for the protected-Club and grant-coupling rationale, and `CONTEXT.md` for the USSTM Club and updated Administrator language.
