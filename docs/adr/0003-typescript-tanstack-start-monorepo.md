# Build a TypeScript TanStack Start monorepo

The system will use a pnpm-workspace monorepo orchestrated by Turborepo, with independently deployable applications and shared packages. User interfaces will use TanStack Start, TypeScript, shadcn/ui, and Tailwind CSS. This stack applies to the portal application; the central auth service is a Better Auth service boundary rather than a second TanStack Start app. Shared packages still allow future USSTM applications to reuse contracts, auth clients, configuration, and UI primitives.
