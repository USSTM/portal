# Administer Bookings

Type: AFK  
Label: `ready-for-agent`

## What to build

Give USSTM Administrators tools to place Board Members into empty future Shifts, cancel future Bookings, reassign occupied future Shifts atomically, and override weekly limits with explicit audit history.

## Acceptance criteria

- [ ] Administrator can book eligible Board Member into empty future Shift.
- [ ] Administrator can cancel any future Booking.
- [ ] Administrator can atomically reassign occupied future Shift.
- [ ] Administrator may override weekly cap but never create two occupants.
- [ ] Past Bookings remain immutable.
- [ ] Override/reassignment records actor, affected members, reason, and before/after state.
- [ ] Transaction and authorization tests cover conflicts and direct API use.

## Blocked by

- [10-book-a-single-seat-shift.md](./10-book-a-single-seat-shift.md)
- [04-use-unified-audit-history.md](./04-use-unified-audit-history.md)
