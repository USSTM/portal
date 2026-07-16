# Enforce authorization in application code

TanStack Start server functions and route loaders will explicitly load the current identity and required grants before accessing protected data. PostgreSQL constraints provide uniqueness and referential integrity, and transactions enforce cross-row invariants, but the system will not use PostgreSQL row-level security, authorization triggers, or stored RPC functions. Because browsers never connect to PostgreSQL, this keeps policy visible in normal TypeScript control flow rather than split across hidden database layers.
