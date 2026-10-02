# Add a Content Manager grant

This supersedes the "three fixed grants" count in ADR-0002. Its rules still hold: grants are fixed and come from row presence, there are no configurable roles, and an Active Member must hold at least one grant.

The Website needs editors who are not Administrators, for example a communications executive who builds Pages but must not manage Members or Clubs. Making every editor an Administrator would hand out far more authority than editing needs. Keeping Payload's own user list would add a second identity system next to personal Google identities (ADR-0001, ADR-0008). Instead, a fourth fixed grant, Content Manager, lets a Member build and edit Website Pages, Media, and site settings.

Administrators grant and revoke Content Manager the same way they manage Board Member authority, and those changes are audited (ADR-0010). Every Administrator holds Content Manager authority implicitly while they remain an Administrator, as with USSTM Club Access (ADR-0016). The Superuser holds it as part of all Administrator authority. A Member whose only grant is Content Manager is an Active Member.

The schema adds a `content_managers` table related to `members`, following the existing per-grant tables. Payload authenticates through the shared auth service and admits only Content Managers. Payload's own Users collection is retired.
