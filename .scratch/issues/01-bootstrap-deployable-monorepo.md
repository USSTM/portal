# Bootstrap deployable monorepo

Type: AFK  
Label: `ready-for-agent`

## What to build

Create the smallest runnable pnpm/Turborepo system containing an independently buildable TanStack Start portal application, a central Better Auth service, shared TypeScript configuration and UI primitives, PostgreSQL/Drizzle connectivity, and local Docker Compose orchestration. A developer can start the stack and verify the portal UI, the auth service boundary, and database dependency through health checks.

## Acceptance criteria

- [ ] One documented command installs dependencies and starts the local stack.
- [ ] Portal renders a distinct shadcn/Tailwind shell.
- [ ] The central auth service is built around Better Auth and is not a second TanStack Start UI app.
- [ ] Each application exposes a health check that reflects database readiness.
- [ ] Each service builds and runs independently.
- [ ] PostgreSQL is private to the Compose network and uses service-specific roles/schemas.
- [ ] Baseline unit and database integration test commands pass.

## Blocked by

None - can start immediately.

## Implementation notes

- Bootstrapped a TanStack Start portal application and a central Better Auth service boundary with a shared shadcn UI package and the requested TweakCN theme.
- Added private Compose PostgreSQL, service-owned `portal` and `auth` roles/schemas, and Drizzle-backed health checks.
- Portal and the headless Better Auth service build and pass TypeScript checks with Node 22. The auth service route tests pass. Docker-backed integration verification remains pending because the local Docker daemon is unavailable.
