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
An organization associated with USSTM whose events and other portal records may be managed by authorized Members.
_Avoid_: User, group account

**Archived Club**:
A Club that cannot receive Club Access or participate in new Events but remains attached to its historical records.
_Avoid_: Deleted club, inactive user

**Club Access**:
Authority granted to a Member to use Portal functionality for one specified Club.
_Avoid_: Club role, club membership, account access

**Board Member**:
A Member authorized to use Office Hours and manage their own Bookings.
_Avoid_: Board user, office-hours user

**Board Position**:
The Administrator-managed organizational title displayed with a Board Member's name on the public Office Hours calendar.
_Avoid_: Role, permission

**Administrator**:
A Member authorized to manage non-administrator Members, grants, Clubs, Events, Resources, and Bookings. Only the Superuser may create or modify an Administrator or any of their grants.
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

## Resources

**Resource**:
An external link and short description maintained by Administrators for Active Members and the Superuser.
_Avoid_: Document, content page

## Administration

**Audit Entry**:
An immutable record attributing one privileged administrative change to an authenticated Member or the Superuser.
_Avoid_: Activity, event, application log
