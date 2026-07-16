# Use TanStack Start despite release-candidate status

The portal will use TanStack Start, TypeScript, Tailwind CSS, and ShadCN UI even though TanStack Start is still identified as a release candidate at design time. Exact TanStack versions and pnpm are pinned, the lockfile is committed, experimental integrations and broad version ranges are avoided, and upgrades require the full test and build suite. ShadCN default styles are retained except that the primary color is USSTM navy `#002956`.

The frontend prefers TanStack Router and Start for routing, TanStack Query for server state and mutations, and TanStack Table for Administration tables. Forms use React Hook Form rather than TanStack Form. Other TanStack utilities are added only for concrete feature needs, not by default.

Feature-level Zod schemas validate React Hook Form input and every server-function or public-route boundary. Drizzle's database schema remains separate rather than being generated from form validation or used as a replacement for boundary validation.
