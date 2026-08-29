# 11 — Attribute Organizing Clubs

**What to build:** Multi-Club Event attribution that keeps lifecycle control with one Owning Club and gives additional Organizing Clubs read-only visibility.

**Blocked by:** 10 — Edit and delete Events safely

**Status:** resolved

- [x] An Event owner can add or remove zero or more distinct active Organizing Clubs.
- [x] The Owning Club is always presented as participating and cannot be duplicated in the additional organizer list.
- [x] Archived Clubs cannot be newly selected but remain attributed on existing Events.
- [x] Members with Club Access to an Organizing Club see the Event in their authenticated list without edit or delete controls.
- [x] Only the Owning Club may change the organizer list through Club Access.
- [x] Event cards and details clearly distinguish ownership from additional attribution.
- [x] Integration tests cover duplicate prevention, archived Club behavior, read-only organizer access, and owner-only mutation.
