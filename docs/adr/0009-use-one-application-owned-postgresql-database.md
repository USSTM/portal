# Use one application-owned PostgreSQL database

The TanStack Start application will exclusively own one PostgreSQL database containing Members, grants, Clubs, Events, Office Hours, Resources, and audit data. The stateless auth microservice receives no database access. Keeping authorization and domain data together allows transactional enforcement of grant changes and Booking rules without cross-service calls or duplicated sources of truth.

The application will use Drizzle ORM with `node-postgres`, a TypeScript schema, and generated SQL migrations that are reviewed, committed, and applied explicitly during deployment. Complex constraints and migrations may use raw SQL directly. The codebase will not add repository classes or a generic data-access layer over Drizzle.
