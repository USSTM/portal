# 02 — Sign in through shared Google authentication

**What to build:** A complete Google sign-in and sign-out path through the reusable auth service, ending in either an authenticated Superuser session or a generic access-denied page.

**Blocked by:** 01 — Bootstrap the runnable workspace

**Status:** ready-for-agent

- [ ] The Hono service performs Google's authorization-code flow with `state`, PKCE, and the user-info endpoint.
- [ ] Only a verified email is extracted; Google profile fields and access or refresh tokens are discarded.
- [ ] Email normalization trims and lowercases only, without alias, dot, or tag rewriting.
- [ ] Allowlisted client configuration rejects unknown origins, audiences, callback paths, and non-relative return paths.
- [ ] The auth service issues an asymmetric, audience-bound, host-only, secure, HTTP-only, `SameSite=Lax` cookie that expires after eight hours without renewal.
- [ ] The Portal verifies the cookie and admits the configured Superuser while showing a generic denial for unknown emails.
- [ ] Logout clears only the application's local session cookie.
- [ ] The auth service has no database access and no fake-login endpoint.
- [ ] Integration tests use a fake Google boundary and test keys without external network calls.

