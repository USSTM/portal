# 04 — Drop the legacy Website events tables

**What to build:** After the cutover, the restored database still contains the tables of the retired Payload Events collection. Remove them with a reviewed Payload migration.

**Blocked by:** 03 — Cut over the Website from Supabase

**Status:** ready-for-agent

- [ ] A Payload migration drops the `events` tables and any relationship columns that pointed at them.
- [ ] It is applied in production only after the Website is confirmed to read Events from the Portal.
- [ ] `payload migrate:status` is clean afterwards.
