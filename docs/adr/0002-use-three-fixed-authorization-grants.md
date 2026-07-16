# Use three fixed authorization grants

Database authorization uses three fixed grants that a Member may hold in any combination: Club Access scoped to one Club, Board Member authority, and global Administrator authority. The deployment-owned Superuser is separate from these database grants. The system will not offer configurable roles or arbitrary permission composition because the known access patterns do not justify the implementation and maintenance cost of a permission matrix.

The PostgreSQL schema represents these grants with explicit `club_access`, `board_members`, and `administrators` tables related to `members`. Row presence grants authority, and primary or composite-key constraints prevent duplicates. There are no generic roles, permissions, or polymorphic grants tables.

An Active Member must hold at least one grant. Creation and reactivation assign the initial grant transactionally, while revoking the final grant deactivates the Member.
