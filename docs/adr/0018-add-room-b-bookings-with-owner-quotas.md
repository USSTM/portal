# Book Room B with shared Club and personal Board Member limits

EPH 442B has its own booking calendar for signed-in portal users. A public calendar linked from sign-in and a separate TV display share schedule labels and times without booking controls or private identifiers. Bookings run Monday–Friday, 8 AM–10 PM Toronto time, in the current or next week. Each Club shares a limit of two hours per day and six hours per Monday–Sunday week. Board Members get the same personal allowance. Usage comes from uncancelled bookings, so no weekly reset job is needed.

Members can book for Clubs they have access to; personal bookings require Board Member authority. Administrators and the Superuser can book for any eligible owner, delete future bookings, and overwrite them with confirmation. Their own Board Member bookings are unlimited; another owner's limits still apply. Board Position titles grant no exceptions. Extra Club time is booked under an eligible Administrator's own name.

Any current Club representative can cancel the Club's future bookings; Board Members can cancel their own. Removing a representative leaves Club bookings intact. Deactivation, Board authority revocation, or Club archival cancels the affected owner's future bookings while preserving history.

Each database row reserves one hour. Transactions, a shared room lock, and a unique active-hour constraint prevent double bookings and quota races. A failed overwrite preserves the original booking. Creator emails stay private, and privileged changes follow the existing audit policy. See the [Room B API](../api/room-b.md) for implementation details.

Day, week, and month views support browsing independently of booking eligibility. The public TV display uses standalone HTML for BrightSign compatibility, refreshes every three minutes, and retains the last loaded schedule with a warning during connection failures. These reads use existing bookings without changing the data model.
