# Administer Clubs and Access Grants

Type: AFK  
Label: `ready-for-agent`

## What to build

Give USSTM Administrators one portal UI for creating and deactivating Clubs, issuing and revoking full-management Access Grants, binding granted emails to stable Google identities, recovering bindings, and managing other USSTM Administrators. Auth service remains policy and data owner behind a server-to-server portal integration.

## Acceptance criteria

- [ ] Administrator can create and reversibly deactivate a Club.
- [ ] Administrator can grant/revoke one identity's full management access to one or more Clubs.
- [ ] Email grant binds to Google issuer/subject on first successful login.
- [ ] Only administrator with recent reauthentication can reset binding.
- [ ] One administrator may add/remove another, but final active administrator cannot be removed or suspended.
- [ ] USSTM Administrators automatically manage every Club.
- [ ] Grant or administrator revocation stops active access within five minutes.
- [ ] Club Accounts and Members cannot administer Access Grants.

## Blocked by

- [02-sign-into-portal-through-central-google-sso.md](./02-sign-into-portal-through-central-google-sso.md)
