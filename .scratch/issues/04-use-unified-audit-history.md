# Use unified audit history

Type: AFK  
Label: `ready-for-agent`

## What to build

Record append-only auth and portal audit history owned by each service and show both streams in one administrator-only portal view. Entries must establish who changed what, for which Club, and through which request without exposing secrets.

## Acceptance criteria

- [ ] Auth and portal services write only their own audit records.
- [ ] Sensitive authentication, administrator, grant, Club, content, schedule, and Booking-override actions are recorded.
- [ ] Entry includes actor, active Club when relevant, action, target, timestamp, request ID, and safe before/after summary.
- [ ] Portal merges both service streams into searchable chronological view.
- [ ] Normal users cannot read or mutate audit history.
- [ ] Records purge automatically after two years.
- [ ] Tokens, secrets, and unnecessary personal data are redacted.

## Blocked by

- [03-administer-clubs-and-access-grants.md](./03-administer-clubs-and-access-grants.md)
