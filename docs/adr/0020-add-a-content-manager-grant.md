# Add a Content Manager grant

This supersedes the "three fixed grants" count in ADR-0002. Its rules still hold: grants are fixed and come from row presence, there are no configurable roles, and an Active Member must hold at least one grant.

The Website needs editors who are not Administrators, for example a communications executive who builds Pages but must not manage Members or Clubs. Making every editor an Administrator would hand out far more authority than editing needs. Keeping Payload's own user list would add a second identity system next to personal Google identities (ADR-0001, ADR-0008). Instead, a fourth fixed grant, Content Manager, lets a Member build and edit Website Pages, Media, and site settings.

Administrators grant and revoke Content Manager the same way they manage Board Member authority, and those changes are audited (ADR-0010). Every Administrator holds Content Manager authority implicitly while they remain an Administrator, as with USSTM Club Access (ADR-0016). The Superuser holds it as part of all Administrator authority. A Member whose only grant is Content Manager is an Active Member.

The schema adds a `content_managers` table related to `members`, following the existing per-grant tables. Payload authenticates through the shared auth service and admits only Content Managers. Payload's own Users collection is retired.

## Sign-in on the Website origin

Content Managers sign in on the Website's own origin. Caddy routes `/auth/*` on `WEBSITE_ADDRESS` to the auth service, which ADR-0008 allows for any allowlisted application origin, and a `website` client in `AUTH_CLIENTS` gives it a host-only `__Host-website-session` cookie for the `website` audience. Signing in through the Portal origin was rejected because a host-only cookie set there never reaches the Website.

A Payload auth strategy verifies that session with `@usstm/auth-session`, then asks the Portal at `GET /api/website/content-manager-authority` (`docs/api/content-manager-authority.md`), presenting the session itself as a bearer token. The Portal answers only for the email in the session, so the applications share no secret and the Website never reads the Portal database. Authority is re-checked on every request, and the Website denies access whenever the Portal cannot confirm it.

Payload still needs a stored auth collection, because its document locks and preferences reference user rows. The Users collection and its passwords are therefore replaced by a password-less `content-managers` collection that only mirrors who has signed in. Its rows are created by the strategy and cannot be created or edited through Payload.
