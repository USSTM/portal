# 06 — Sign in to Payload through the shared auth service

**What to build:** Replace Payload's own email and password login with the shared auth service, so that only Content Managers can open `/admin`.

**Blocked by:** 05 — Add the Content Manager grant

**Status:** ready-for-human

- [x] The auth service has a `website` client (audience, callback, cookie) in `AUTH_CLIENTS`.
- [x] A custom Payload auth strategy verifies the session with `@usstm/auth-session` and resolves Content Manager authority from the Portal.
- [x] Members without Content Manager authority are denied, and the denial is tested.
- [x] Payload's Users collection and password login are removed, with a migration.
- [x] Caddy routes `/auth/*` on `WEBSITE_ADDRESS`, or the Website signs in through the Portal origin, whichever ADR-0008 allows. Record the choice.

## Comments

- The choice: Caddy routes `/auth/*` on `WEBSITE_ADDRESS`. ADR-0008 allows the auth service on any allowlisted origin, and a host-only cookie set on the Portal origin would never reach the Website. Recorded in ADR-0020.
- The Website asks the Portal for authority at `GET /api/website/content-manager-authority`, presenting its own session as a bearer token (`docs/api/content-manager-authority.md`). The apps share no secret, and the Website fails closed when the Portal is unavailable.
- Payload still needs a stored auth collection, because its document locks and preferences reference user rows. `users` is replaced by a password-less `content-managers` collection that the strategy fills on first sign-in. Its rows cannot be created or edited through Payload.
- Two migrations, because drizzle-kit's rename prompt needs a TTY: `add_content_managers`, then `remove_users`. The generated SQL dropped tables with CASCADE before dropping the constraints that referenced them, which would fail, so both were reordered. `remove_users` also deletes admin preferences and document locks held by the old users.
- Needs a human:
  - Apply the migrations against a copy of the website database.
  - Add `https://<WEBSITE_ADDRESS>/auth/callback` (and `http://localhost:3002/auth/callback` for development) to the Google OAuth client.
  - Set `WEBSITE_AUTH_*` and the `website` client in `AUTH_CLIENTS` on the host.
  - Sign in to `/admin` in a browser as a Content Manager and as a denied Member.
  - Check that Payload's admin keeps the session without trying to refresh a Payload token.
  - The new integration and deployment tests were not run (no Docker where this was built).
