# 05 — Add the Content Manager grant

**What to build:** Introduce Content Manager, the fourth fixed grant (ADR-0020), which authorizes a Member to build and edit Website Pages, Media and site settings.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] A `content_managers` table relates to `members`, following the existing per-grant tables.
- [ ] Administrators grant and revoke Content Manager from the Members UI; each change writes an Audit Entry.
- [ ] Every Administrator, and the Superuser, holds Content Manager authority implicitly, without a row.
- [ ] A Member whose only grant is Content Manager is an Active Member; revoking it deactivates them, as for any final grant.
- [ ] Authorization tests cover granting, revoking, implicit Administrator authority, and denial for other Members.
