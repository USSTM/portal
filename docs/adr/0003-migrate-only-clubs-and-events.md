# Migrate only Clubs and Events

The new portal will migrate all legacy Clubs and all past and future Events. It will not migrate board rosters, Office Hours Bookings, credentials, authentication identifiers, or sessions. This preserves the Portal's organizational and event history while allowing personal authorization and Office Hours data to begin with a clean, unambiguous model.

Migration preserves legacy Club and Event UUIDs. Legacy `users.id` values become Club IDs, `events.created_by` becomes the Owning Club reference, and legacy organizer relationships become additional Organizing Clubs after duplicate owner rows are removed.

Cutover uses a maintenance window and a one-time idempotent import. The migration validates row counts, identifiers, relationships, and timestamps before the new application opens; the system will not implement dual writes, change-data capture, or rollback synchronization with the legacy Portal.

The five legacy Finance and four legacy Operations links are seeded as initial active Resources in their existing order. They are initial application content rather than additional legacy database migration scope and become Administrator-managed after deployment.
