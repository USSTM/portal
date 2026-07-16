# 11 — Attribute Organizing Clubs

**What to build:** Multi-Club Event attribution that keeps lifecycle control with one Owning Club and gives additional Organizing Clubs read-only visibility.

**Blocked by:** 10 — Edit and delete Events safely

**Status:** ready-for-agent

- [ ] An Event owner can add or remove zero or more distinct active Organizing Clubs.
- [ ] The Owning Club is always presented as participating and cannot be duplicated in the additional organizer list.
- [ ] Archived Clubs cannot be newly selected but remain attributed on existing Events.
- [ ] Members with Club Access to an Organizing Club see the Event in their authenticated list without edit or delete controls.
- [ ] Only the Owning Club may change the organizer list through Club Access.
- [ ] Event cards and details clearly distinguish ownership from additional attribution.
- [ ] Integration tests cover duplicate prevention, archived Club behavior, read-only organizer access, and owner-only mutation.

