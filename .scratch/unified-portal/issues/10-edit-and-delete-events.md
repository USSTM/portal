# 10 — Edit and delete Events safely

**What to build:** Safe Event maintenance for the Owning Club, including historical restrictions and protection from silently overwriting someone else's changes.

**Blocked by:** 09 — Create and list Club Events

**Status:** ready-for-agent

- [ ] Members with Club Access to the Owning Club can edit future and ongoing Event details.
- [ ] Members without access to the Owning Club cannot modify the Event.
- [ ] Completed Events cannot be edited or deleted through Club Access.
- [ ] Only Events that have not started may be deleted, and deletion requires confirmation.
- [ ] Event updates run full server-side validation and store last-editor attribution and update timestamp.
- [ ] Submissions include the last known update timestamp and fail with a reload instruction when another edit won first.
- [ ] Personal creator and editor attribution is visible only to Administrators and the Superuser.
- [ ] Integration tests cover authority, lifecycle boundaries, deletion, and concurrent-update conflicts.

