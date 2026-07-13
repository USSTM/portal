# Sign into portal through central Google SSO

Type: HITL  
Label: `ready-for-human`

## What to build

Allow a provisioned identity to sign into the portal through the central Better Auth service and Google, while rejecting unprovisioned identities with a public contact path. Bootstrap the initial USSTM Administrators once in the Better Auth service, establish a portal-local session through OAuth 2.1/OIDC, enforce the agreed idle and absolute lifetimes, and support local logout.

## Acceptance criteria

- [ ] The Better Auth service uses Google with only `openid`, `email`, and `profile` scopes.
- [ ] Portal uses authorization-code flow with PKCE and host-only secure cookies.
- [ ] One-time bootstrap provisions the three agreed initial administrator emails without reconciling them on startup.
- [ ] Provisioned identity reaches authenticated portal; unprovisioned identity receives contact guidance and no portal access.
- [ ] Session has 12-hour idle and seven-day absolute lifetime.
- [ ] Logout ends only current portal session.
- [ ] Auth tests use local test identity mechanism; secrets never enter repository.

## Blocked by

- [01-bootstrap-deployable-monorepo.md](./01-bootstrap-deployable-monorepo.md)

## Implementation notes

- Implemented Better Auth Google upstream login and OAuth 2.1/OIDC provider configuration with S256 PKCE, trusted portal client registration, and server-held portal tokens.
- Added one-time USSTM Administrator bootstrap, first-login Google identity binding, immediate authorization rechecks, 12-hour idle/seven-day absolute portal sessions, and local logout with portal-token revocation.
- Added test-only local identities plus callback, denial, expiry, cookie, revocation, outage, and logout coverage. Real Google acceptance remains a human step requiring credentials and the three agreed email addresses.
- Board Member and Access Grant provisioning remain owned by their later tickets; Issue 2 can initially provision the three bootstrapped USSTM Administrators.
