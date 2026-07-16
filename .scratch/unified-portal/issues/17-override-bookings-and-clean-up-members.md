# 17 — Override Bookings and enforce Member cleanup

**What to build:** Administrator scheduling overrides plus the cross-feature lifecycle rules that keep future staffing consistent with current Member authority.

**Blocked by:** 03 — Let the Superuser provision Administrators; 16 — Let Board Members manage their Bookings

**Status:** ready-for-agent

- [ ] Administrators and the Superuser can create or cancel a future Booking for any Board Member.
- [ ] Administrator-created Bookings may bypass the normal two-week window and five-per-week limit.
- [ ] Overrides cannot book a non-Board Member or alter a Booking after its Shift starts.
- [ ] Every Administrator or Superuser Booking override creates an Audit Entry.
- [ ] Revoking Board Member authority or deactivating a Member cancels all future Bookings in the same transaction.
- [ ] Changing display name or Board Position updates future Booking snapshots only.
- [ ] Past Booking snapshots and Member references remain unchanged after profile, grant, or lifecycle changes.
- [ ] Integration tests cover override authority, bypass behavior, immutable history, automatic cancellation, snapshot updates, and audit creation.

