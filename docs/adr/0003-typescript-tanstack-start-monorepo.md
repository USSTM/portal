# Build a TypeScript TanStack Start monorepo

The system will use a pnpm-workspace monorepo orchestrated by Turborepo, with independently deployable applications and shared packages. User interfaces will use TanStack Start, TypeScript, shadcn/ui, and Tailwind CSS. This keeps the combined portal and central auth application on one stack while allowing future USSTM applications to reuse contracts, auth clients, configuration, and UI primitives.
