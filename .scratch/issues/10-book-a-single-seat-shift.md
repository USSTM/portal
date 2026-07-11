# Book a single-seat Shift

Type: AFK  
Label: `ready-for-agent`

## What to build

Allow a Board Member using named identity to reserve one empty future Shift and cancel own future Booking. Enforce single-seat concurrency, configurable booking horizon, and configurable weekly cap at database-backed server boundary.

## Acceptance criteria

- [ ] Eligible Board Member can book empty future Shift and cancel own future Booking.
- [ ] Concurrent attempts produce exactly one Booking and clear loser response.
- [ ] Default booking horizon is 14 days and administrator can configure it.
- [ ] Default weekly cap is five and administrator can configure it.
- [ ] Shortening horizon does not cancel existing Bookings.
- [ ] Past Shifts/Bookings cannot be changed by Board Members.
- [ ] UI shows availability, personal Booking state, cap, and valid horizon.
- [ ] PostgreSQL integration tests prove seat uniqueness and weekly-cap behavior.

## Blocked by

- [09-designate-board-members-and-configure-office-hours.md](./09-designate-board-members-and-configure-office-hours.md)
