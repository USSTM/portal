# Designate Board Members and configure office hours

Type: AFK  
Label: `ready-for-agent`

## What to build

Let USSTM Administrators designate named Members as Board Members with public display name and position, and configure effective-dated recurring Shift Slots. Publish generated single-seat Shifts through public calendar and unauthenticated API without exposing private identity data.

## Acceptance criteria

- [ ] Administrator can manually designate/remove Board Member and set display name/position.
- [ ] Board Member designation alone grants portal admission without Club Access Grant.
- [ ] Club Account cannot become eligible to book through Club access.
- [ ] Administrator configures weekday/start/end and effective range for Shift Slot.
- [ ] Existing Shifts never silently move when schedule changes.
- [ ] Shift generation handles Toronto daylight-saving transitions correctly.
- [ ] Public calendar/API expose date/time and booked display name/position only.

## Blocked by

- [03-administer-clubs-and-access-grants.md](./03-administer-clubs-and-access-grants.md)
