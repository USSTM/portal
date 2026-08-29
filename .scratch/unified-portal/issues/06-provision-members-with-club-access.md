# 06 — Provision Members with Club Access

**What to build:** An Administrator workflow for admitting non-administrator Members and granting them explicit authority over one or more Clubs.

**Blocked by:** 05 — Administer Clubs

**Status:** resolved

- [x] Administrators and the Superuser can create a non-administrator Member with display name, normalized unique email, and at least one Club Access grant in one transaction.
- [x] A Member may receive Club Access to multiple active Clubs without a global active-Club context.
- [x] Administrators can add or revoke Club Access and view Members by status and grant.
- [x] Revoking the final grant deactivates the Member; explicit deactivation revokes all grants.
- [x] Reactivation requires at least one newly assigned grant and does not restore old grants.
- [x] Changing a non-administrator Member's email requires confirmation, transfers access immediately, and preserves the Member ID and history.
- [x] Provisioning sends no invitation and Members cannot edit their own profile or grants.
- [x] Ordinary Administrators cannot target Administrator records through this workflow.
- [x] All Member and grant mutations create Audit Entries, with integration tests covering admission, denial, lifecycle, and authorization.
