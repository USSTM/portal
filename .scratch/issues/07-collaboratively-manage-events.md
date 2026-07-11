# Collaboratively manage Events

Type: AFK  
Label: `ready-for-agent`

## What to build

Allow authorized identities for every Organizing Club to edit Event details while reserving ownership, organizer-list changes, and permanent future deletion for Owning Club and USSTM Administrators. Detect concurrent edits instead of silently overwriting them.

## Acceptance criteria

- [ ] Owning Club can add/remove collaborating Organizing Clubs.
- [ ] Any currently authorized Organizing Club can edit Event details.
- [ ] Only Owning Club or USSTM Administrator can change ownership or organizer list.
- [ ] Only Owning Club or USSTM Administrator can permanently delete future Event.
- [ ] Stale edit receives conflict response and current Event data.
- [ ] Public page/API reflect accepted changes and deletion.
- [ ] Authorization and optimistic-concurrency tests cover direct API calls.

## Blocked by

- [06-create-and-publicly-list-events.md](./06-create-and-publicly-list-events.md)
