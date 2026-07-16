# Deactivate Members instead of deleting them

The Administration module will deactivate Members rather than permanently delete them. Deactivation immediately blocks sign-in, revokes every grant, and cancels future Bookings while preserving past Bookings and audit attribution; reactivation does not restore prior grants automatically. This prevents administrative cleanup from destroying accountability or breaking historical references.

Creating or reactivating an Active Member requires at least one grant in the same transaction, and revoking a Member's final grant deactivates them. Ordinary Administrators may assign Club Access and Board Member authority, while only the Superuser may create or reactivate an Administrator.

Bookings retain snapshots of the public display name and Board Position used when they were made. Member profile changes update future Booking snapshots only, so past calendar history remains stable after profile changes or deactivation.
