# Self-host PostgreSQL with service-owned schemas

The new system will eliminate Supabase, including Supabase Auth and its hosted database, and run PostgreSQL through Docker Compose. The auth service and portal service will own separate schemas and connect with separate database roles, while initially sharing one PostgreSQL deployment to keep operations simple. This preserves service data boundaries without requiring USSTM to operate multiple database servers.
