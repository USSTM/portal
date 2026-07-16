# 15 — Show the public Office Hours calendar

**What to build:** One accessible weekly Office Hours calendar that works for anonymous and authenticated visitors before Booking controls are added.

**Blocked by:** 01 — Bootstrap the runnable workspace

**Status:** ready-for-agent

- [ ] The four fixed daily Shift Slots are seeded for Monday through Friday with no configuration UI.
- [ ] `/office-hours` is public and defaults to the current Toronto week.
- [ ] A valid `week` query date normalizes to its Monday, with previous, next, and current-week controls.
- [ ] Visitors may navigate to any past or future week.
- [ ] Every dated Shift displays its booked Board Member names and Board Positions or a clear empty state.
- [ ] The same route remains read-only for anonymous visitors and authenticated identities without Booking authority.
- [ ] The calendar works on narrow screens, supports keyboard use, and never communicates state by color alone.
- [ ] Unit and integration tests cover Toronto week calculations, daylight-saving boundaries, navigation, seeded slots, and public access.

