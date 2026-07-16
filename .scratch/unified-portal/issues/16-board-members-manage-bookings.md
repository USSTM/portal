# 16 — Let Board Members manage their Bookings

**What to build:** Server-confirmed Office Hours Booking and cancellation for Board Members with transactional enforcement of every scheduling rule.

**Blocked by:** 07 — Designate Board Members; 15 — Show the public Office Hours calendar

**Status:** ready-for-agent

- [x] A Board Member can book an eligible Shift in the current or immediately following Toronto week.
- [x] A Board Member can hold at most five Bookings per Monday-Sunday week.
- [x] Multiple Board Members may book the same Shift, but one Member cannot book the same dated Shift Slot twice.
- [x] A Board Member may cancel only their own Booking and only before the Shift starts.
- [x] Every Booking stores the Member reference plus display-name and Board-Position snapshots.
- [x] Structural uniqueness and a transaction that locks the affected Member prevent duplicate and concurrent weekly-limit violations.
- [x] Booking controls remain pending until server confirmation, then invalidate TanStack Query data; no optimistic rollback behavior is used.
- [x] Failed mutations show clear non-field feedback without changing the calendar incorrectly.
- [x] Integration tests cover authorization, booking windows, weekly limits, duplicate prevention, cancellation, multiple staff, and concurrent requests.
