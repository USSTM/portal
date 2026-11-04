# 05 — Add the Content Manager grant

**What to build:** Introduce Content Manager, the fourth fixed grant (ADR-0020), which authorizes a Member to build and edit Website Pages, Media and site settings.

**Blocked by:** None — can start immediately

**Status:** ready-for-human

- [x] A `content_managers` table relates to `members`, following the existing per-grant tables.
- [x] Administrators grant and revoke Content Manager from the Members UI; each change writes an Audit Entry.
- [x] Every Administrator, and the Superuser, holds Content Manager authority implicitly, without a row.
- [x] A Member whose only grant is Content Manager is an Active Member; revoking it deactivates them, as for any final grant.
- [x] Authorization tests cover granting, revoking, implicit Administrator authority, and denial for other Members.

## Comments

- Migration `0015_add-content-managers` adds the table. `hasContentManagerAuthority(identity)` in `features/admin/content-managers.ts` is the check that 06 can reuse.
- Content Manager now counts as a grant for sign-in (`isActiveMember`) and in every final-grant check (revoking Club Access or Board Member authority). Deactivating a Member or an Administrator removes it.
- Members can be provisioned or reactivated with Content Manager as their only grant. Administrators never get a row, and granting one to an Administrator is refused.
- Needs a human: `content-managers.integration.test.ts` was written but not run (no database where it was built), and the Members UI has not been checked in a browser.
