# Sign into portal through central Google SSO

Type: HITL  
Label: `ready-for-human`

## What to build

Allow a provisioned identity to sign into the portal through the central Better Auth service and Google, while rejecting unprovisioned identities with a public contact path. Bootstrap the initial USSTM Administrators once, establish a portal-local session through OAuth 2.1/OIDC, enforce the agreed idle and absolute lifetimes, and support local logout.

## Acceptance criteria

- [ ] Better Auth uses Google with only `openid`, `email`, and `profile` scopes.
- [ ] Portal uses authorization-code flow with PKCE and host-only secure cookies.
- [ ] One-time bootstrap provisions the three agreed initial administrator emails without reconciling them on startup.
- [ ] Provisioned identity reaches authenticated portal; unprovisioned identity receives contact guidance and no portal access.
- [ ] Session has 12-hour idle and seven-day absolute lifetime.
- [ ] Logout ends only current portal session.
- [ ] Auth tests use local test identity mechanism; secrets never enter repository.

## Blocked by

- [01-bootstrap-deployable-monorepo.md](./01-bootstrap-deployable-monorepo.md)
