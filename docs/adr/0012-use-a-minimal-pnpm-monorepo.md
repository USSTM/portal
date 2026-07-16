# Use a minimal pnpm monorepo

The repository will use a plain pnpm workspace with `apps/portal` for TanStack Start, `apps/auth` for Hono, and one `packages/auth-session` package containing only cookie claims, signing, and verification. Root scripts and `pnpm --filter` will coordinate the workspace; Turborepo, Nx, generic core packages, and shared domain abstractions are excluded. Portal domain code remains inside the portal application.

Within the portal, code is grouped into concrete feature folders for Events, Office Hours, Resources, administration, Account, and Contact, alongside small database, authentication, route, and shared-component areas. Features call Drizzle directly from authorized server functions. The design excludes controller-service-repository layering, dependency injection, command buses, generic CRUD frameworks, and speculative shared abstractions.

Local development, CI, and production containers use Node.js 24 LTS. The root `packageManager` field pins pnpm, and the workspace commits one lockfile.
