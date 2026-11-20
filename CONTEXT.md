# USSTM Portal

The USSTM Portal gives individuals explicit authority to act for USSTM and its associated clubs without treating organizations as login identities.

## Language

**Member**:
An individual person explicitly admitted by an Administrator or the Superuser who may receive authority to act for USSTM or one or more Clubs. A successfully authenticated email address is not a Member unless it was admitted in advance.
_Avoid_: User, account, club account

**Active Member**:
A Member with at least one current grant who may sign in to the portal.
_Avoid_: Enabled user, registered user

**Deactivated Member**:
A Member who can no longer sign in or hold grants but whose historical activity remains attributed to them.
_Avoid_: Deleted user, removed account

**Club**:
An organization associated with USSTM whose events and other portal records may be managed by authorized Members. One Club, the USSTM Club, represents USSTM itself rather than an associated organization.
_Avoid_: User, group account

**USSTM Club**:
The single protected Club representing USSTM. It cannot be archived or renamed, always holds Owning Club and Organizing Club eligibility, and is the Club Access every Administrator holds while they remain an Administrator.
_Avoid_: Root club, default club

**Archived Club**:
A Club that cannot receive Club Access or participate in new Events but remains attached to its historical records.
_Avoid_: Deleted club, inactive user

**Club Access**:
Authority granted to a Member to use Portal functionality for one specified Club.
_Avoid_: Club role, club membership, account access

**Board Member**:
A Member authorized to use Office Hours, manage their own Bookings, and reserve Room B under their own name.
_Avoid_: Board user, office-hours user

**Board Position**:
The Administrator-managed organizational title displayed with a Board Member's name on the public Office Hours calendar.
_Avoid_: Role, permission

**Administrator**:
A Member authorized to manage non-administrator Members, grants, Clubs, Events, Resources, and Bookings, and who holds USSTM Club Access for as long as they remain an Administrator. Only the Superuser may create or modify an Administrator or any grant belonging to one. An Administrator may also hold other Club Access or Board Member authority.
_Avoid_: Superuser, root user

**Superuser**:
The single deployment-owned identity with all Administrator authority and exclusive authority over Administrator access. The Superuser is not a Member and cannot be managed through the portal.
_Avoid_: Administrator, root user

## Events

**Event**:
A publicly visible scheduled activity owned by one Club and optionally attributed to other participating Clubs.

**Owning Club**:
The Club responsible for an Event's details, organizer list, and lifecycle.
_Avoid_: Creator, creating user

**Organizing Club**:
A Club publicly attributed as participating in an Event without receiving authority to modify it.
_Avoid_: Collaborator, event owner

## Office Hours

**Shift Slot**:
A recurring Monday-to-Friday time interval from the portal's fixed Office Hours schedule.
_Avoid_: Time slot

**Shift**:
A dated occurrence of a Shift Slot that may be staffed by multiple Board Members.

**Booking**:
One Board Member's reservation of a Shift. A Board Member may have at most one Booking for a given Shift.
_Avoid_: Sign-up, seat

## Room B

Managing Room B bookings at `/room-b` requires an active portal session. A public read-only calendar at `/room-b/calendar`, linked from sign-in, supports day, week, and month browsing. The public TV display at `/room-b/display` shows the current schedule. Both public views expose labels and times without booking controls or private identifiers. Office Hours remains public.

**Room B Booking**:
One owner's reservation of one whole hour in Room B, from 08:00 to 22:00 Monday–Friday. The owner is either an active Club or a Board Member; the Member who creates it is recorded separately. Club representatives share two hours per day and six hours per Monday–Sunday Toronto week. Board Members have their own equivalent allowance. Bookings are limited to future hours in the current or next week.

**Administrator (Room B)**:
An active Member with a current Administrator grant. They may reserve Room B for any active Club or Board Member and overwrite or cancel any future Room B reservation. If they also hold Board Member authority, their personal reservations have no hourly quota. Another owner's limits still apply when selected. Board Position titles confer no Room B privileges.
The deployment-owned Superuser inherits this administrative authority without a Member or Administrator database record. Personal Room B reservations still require an active Board Member record.

## Resources

**Resource**:
An external link and short description maintained by Administrators for Active Members and the Superuser.
_Avoid_: Document, content page

## Administration

**Audit Entry**:
An immutable record attributing one privileged administrative change to an authenticated Member or the Superuser.
_Avoid_: Activity, event, application log
