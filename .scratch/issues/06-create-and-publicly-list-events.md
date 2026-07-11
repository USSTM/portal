# Create and publicly list Events

Type: AFK  
Label: `ready-for-agent`

## What to build

Allow an authorized Club identity to create a timed Event that becomes public immediately, then expose upcoming Events through a responsive public page and versioned unauthenticated JSON API. Portal obtains canonical Club display data through a cached internal auth-service read.

## Acceptance criteria

- [ ] Event requires title, description, Owning Club, start, and end; supports location, address, and online URL.
- [ ] End occurs after start; values store as UTC and display in `America/Toronto`.
- [ ] Successful creation appears immediately in public UI and `/api/v1` response.
- [ ] Public API supports pagination/date filtering, cache headers, rate limiting, and browser GET from any origin.
- [ ] Public representation contains no emails, Google identifiers, or internal authorization data.
- [ ] No draft, recurrence, all-day, upload, or authenticated-read requirement exists.
- [ ] API contract and authorization tests pass.

## Blocked by

- [05-switch-between-accessible-clubs.md](./05-switch-between-accessible-clubs.md)
