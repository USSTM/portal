# Switch between accessible Clubs

Type: AFK  
Label: `ready-for-agent`

## What to build

Let an authenticated identity see all accessible Clubs, select active Club when multiple exist, remember selection per application, and inspect read-only account data. Every server mutation must authorize actual target Club independently of selected UI state.

## Acceptance criteria

- [ ] Single accessible Club selects automatically; multiple Clubs require explicit first selection.
- [ ] Active Club persists per portal application and remains visibly identified.
- [ ] Account page shows verified identity, accessible Clubs, active Club, Board Member status, and session information read-only.
- [ ] User cannot edit profile fields.
- [ ] Stale or forged selected Club never bypasses server authorization.
- [ ] Deactivated Club disappears from usable selections and cannot be mutated.

## Blocked by

- [03-administer-clubs-and-access-grants.md](./03-administer-clubs-and-access-grants.md)
