# EPH 442B Room Booking API

The `/room-b` page uses TanStack Start [server functions](../../apps/portal/src/features/room-b/actions.ts). Booking actions and context require an active portal session; `getPublicRoomBScheduleAction` is read-only and public. Call them with `{ data: input }`.

| Action                         | Method | Input                                    |
| ------------------------------ | ------ | ---------------------------------------- |
| `getPublicRoomBScheduleAction` | GET    | `{ date?: "YYYY-MM-DD", view?: string }` |
| `getRoomBScheduleAction`       | GET    | `{ date?: "YYYY-MM-DD", view?: string }` |
| `getRoomBCalendarAction`       | GET    | `{ week?: "YYYY-MM-DD" }`                |
| `getRoomBBookingContextAction` | GET    | `{ week?: "YYYY-MM-DD" }`                |
| `createRoomBBookingAction`     | POST   | `{ date, startHour, endHour, owner }`    |
| `cancelRoomBBookingAction`     | POST   | `{ bookingId }`                          |
| `overwriteRoomBBookingAction`  | POST   | `{ bookingId, owner, confirmed: true }`  |

An `owner` is either:

```ts
{ kind: 'club', clubId: '<uuid>' }
{ kind: 'boardMember', memberId: '<uuid>' }
```

The calendar returns weekday hourly slots and booking labels. Booking context returns eligible owners, daily/weekly balances, and IDs of bookings the caller can cancel. Creating a booking returns `{ id, date, startHour, endHour }[]`, one entry per hour.

- Bookings are Monday–Friday, 8 AM–10 PM Toronto time, in the current or next week. Hours are integers; `endHour` is exclusive.
- Each Club shares two hours/day and six hours/week. Board Members have the same personal limits. Usage follows Monday–Sunday Toronto weeks without a reset job.
- Members can book and cancel for their Clubs or themselves as Board Members. Administrators and the Superuser can act for any eligible owner, cancel any future booking, and overwrite it with confirmation.
- Administrator and Superuser personal bookings are unlimited but still require Board Member access. Bookings for other owners use that owner's limits.
- Cancellation preserves history and releases the hour. Multi-hour bookings and overwrites succeed together or roll back. Started hours cannot be booked, cancelled, or overwritten.

The legacy `week` parameter is normalized to Monday. Schedule reads accept a specific `date`; without one they open today on weekdays or the upcoming Monday on weekends. Past and future schedules can be viewed.

Apply migrations `0015` and `0016` with `pnpm db:migrate` before using the feature. See [ADR 0018](../adr/0018-add-room-b-bookings-with-owner-quotas.md) for the design decisions.

`getRoomBScheduleAction` accepts `view: "day"`, `"week"`, or `"month"` and defaults to week. The booking page supports day, week, and month views, with date navigation and Today. Phones default to day view; larger screens default to week view. Select a month date to open its full schedule. Browsing does not extend booking permissions.

The public TV URL is `/room-b/display`; its read-only JSON source is `GET /api/v1/room-b/display`. It returns today's reservations, the next upcoming reservation, and `updatedAt`, with no emails or management IDs. Adjacent hours for the same owner are combined. The page refreshes every three minutes, retries automatically, and caches the last successful schedule locally. Connection failures retain that schedule and its timestamp with a warning; yesterday's cached data is never presented as today's availability.

For the BrightSign XD235, configure a full-screen Web Page presentation pointing at `https://<portal-host>/room-b/display`, with a landscape 16:9 output and network time synchronization. The display uses standalone HTML/CSS/JavaScript without the portal bundle or login. Its HTML must load before offline schedule recovery can work; it does not install an offline app shell. Verify on the actual player before rollout, since the [Chromium version depends on BrightSignOS](https://docs.brightsign.biz/develop/developer-tools).

The sign-in page links to `/room-b/calendar`, a public day/week/month calendar with no booking controls, owner quotas, or management IDs. `/room-b` remains the signed-in booking page. Both use the same schedule projection; only the signed-in page loads booking context and mutation actions.
