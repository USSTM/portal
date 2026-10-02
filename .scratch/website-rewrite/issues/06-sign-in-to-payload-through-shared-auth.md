# 06 — Sign in to Payload through the shared auth service

**What to build:** Replace Payload's own email and password login with the shared auth service, so that only Content Managers can open `/admin`.

**Blocked by:** 05 — Add the Content Manager grant

**Status:** ready-for-agent

- [ ] The auth service has a `website` client (audience, callback, cookie) in `AUTH_CLIENTS`.
- [ ] A custom Payload auth strategy verifies the session with `@usstm/auth-session` and resolves Content Manager authority from the Portal.
- [ ] Members without Content Manager authority are denied, and the denial is tested.
- [ ] Payload's Users collection and password login are removed, with a migration.
- [ ] Caddy routes `/auth/*` on `WEBSITE_ADDRESS`, or the Website signs in through the Portal origin, whichever ADR-0008 allows. Record the choice.
