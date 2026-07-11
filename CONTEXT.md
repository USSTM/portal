# USSTM Portal

The USSTM Portal supports USSTM and its associated clubs while keeping organizational authority distinct from the identities used to exercise it.

## Language

**Club**:
An organization associated with USSTM whose events, resources, and other portal records are managed through the portal.
_Avoid_: User, group account

**Club Account**:
A sign-in-capable identity owned by a Club and normally used to manage that Club's records.
_Avoid_: Club, user

**Member**:
An individual person who may receive permission to act for one or more Clubs.
_Avoid_: User

**Access Grant**:
Explicit permission, issued or revoked only by a USSTM Administrator, for a Club Account or Member to access the portal and act for a specified Club. Authentication alone does not provide portal access.
_Avoid_: Whitelist, account

**USSTM Administrator**:
A central authority held by approved Member and USSTM organizational identities. It can establish, suspend, and recover Clubs, Club Accounts, Access Grants, and other USSTM Administrators, and can manage every Club's portal records.
_Avoid_: Super admin, root user

## Events

**Event**:
A publicly listed scheduled activity owned by one Club and optionally organized with other Clubs.

**Owning Club**:
The Club responsible for an Event's lifecycle, including its deletion, ownership, and organizer list.
_Avoid_: Creator

**Organizing Club**:
An Owning Club or collaborating Club whose authorized identities may edit an Event's details.
_Avoid_: User, group, creator

## Office Hours

**Board Member**:
A Member manually designated by a USSTM Administrator as a current member of the USSTM board. Only Board Members may book office-hour shifts.
_Avoid_: Club Account, board user

**Shift Slot**:
An administrator-configured recurring weekday and time interval during which office hours may occur.
_Avoid_: Time slot

**Shift**:
A dated, single-seat occurrence of a Shift Slot that one Board Member may book.

**Booking**:
A Board Member's reservation of a Shift. Board Members may cancel their own future Bookings; USSTM Administrators may override booking limits and cancel any future Booking.
_Avoid_: Sign-up

## Resources

**Resource**:
A private link and description maintained by USSTM Administrators for authenticated portal identities. Resources are categorized and ordered but do not belong to individual Clubs.
_Avoid_: Finance link, operations link
