# 10 — Edit and delete Events safely

**What to build:** Safe Event maintenance for the Owning Club, including historical restrictions and protection from silently overwriting someone else's changes.

**Blocked by:** 09 — Create and list Club Events

**Status:** resolved

- [x] Members with Club Access to the Owning Club can edit future and ongoing Event details.
- [x] Members without access to the Owning Club cannot modify the Event.
- [x] Completed Events cannot be edited or deleted through Club Access.
- [x] Only Events that have not started may be deleted, and deletion requires confirmation.
- [x] Event updates run full server-side validation and store last-editor attribution and update timestamp.
- [x] Submissions include the last known update timestamp and fail with a reload instruction when another edit won first.
- [x] Personal creator and editor attribution is visible only to Administrators and the Superuser.
- [x] Integration tests cover authority, lifecycle boundaries, deletion, and concurrent-update conflicts.
