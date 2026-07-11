# Bootstrap deployable monorepo

Type: AFK  
Label: `ready-for-agent`

## What to build

Create the smallest runnable pnpm/Turborepo system containing independently buildable TanStack Start portal and auth applications, shared TypeScript configuration and UI primitives, PostgreSQL/Drizzle connectivity, and local Docker Compose orchestration. A developer can start the stack and verify each application and database dependency through visible pages and health checks.

## Acceptance criteria

- [ ] One documented command installs dependencies and starts the local stack.
- [ ] Portal and auth applications render distinct shadcn/Tailwind shells.
- [ ] Each application exposes a health check that reflects database readiness.
- [ ] Each service builds and runs independently.
- [ ] PostgreSQL is private to the Compose network and uses service-specific roles/schemas.
- [ ] Baseline unit and database integration test commands pass.

## Blocked by

None - can start immediately.
