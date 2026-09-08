# USSTM Portal

The official portal for the **Undergraduate Science Society of Toronto Metropolitan (USSTM)** and its affiliated student clubs and course unions at Toronto Metropolitan University (TMU).

The USSTM Portal gives individuals explicit authority to act for USSTM and its associated clubs using their personal identities, avoiding shared club logins or treating organizations as user accounts.

---

## Features

- **Public Events & Calendar**: Discover upcoming events across USSTM and affiliated clubs, complete with dates, locations, and participating club attribution.
- **Public Events API**: Unauthenticated REST endpoint (`GET /api/v1/events`) with interval filtering, caching, and CORS support for external consumers.
- **Office Hours**: Dedicated shift slot scheduling and shift booking management for USSTM Board Members.
- **Resource Directory**: Curated operational links, funding forms, reimbursement guides, and room booking resources for active student leaders.
- **Granular Authority & Grants**: Three fixed authorization levels (Club Access, Board Member, Administrator) managed by Administrators and anchored by a deployment Superuser.
- **Immutable Audit History**: Full traceability and audit logging for privileged administrative mutations.
- **Secure Authentication**: Google OAuth 2.0 PKCE flow issuing cryptographically signed ECDSA (P-256) JWT session cookies.

---

## Repository Structure

This repository is organized as a lightweight `pnpm` workspace:

```text
usstm-portal/
├── apps/
│   ├── portal/            # Main web application (TanStack Start, React 19, Vite, Tailwind CSS v4, Drizzle ORM)
│   └── auth/              # Dedicated authentication service (Hono, Arctic, Google OAuth)
├── packages/
│   └── auth-session/      # Shared session token schemas and cryptographic verification routines
├── deployment/            # Production deployment tooling (Caddyfile, Docker Compose, Restic backups, deploy.sh)
├── docs/                  # Architecture Decision Records (ADRs), domain documentation, and API specifications
└── tests/                 # End-to-end and production stack integration tests
```

---

## Prerequisites

- **Node.js**: `^24.18.0` (managed via [`.nvmrc`](.nvmrc))
- **pnpm**: `>= 11.0.0`
- **Docker & Docker Compose v2**: For running PostgreSQL locally and managing the production container stack

---

## Getting Started

### 1. Clone & Install Dependencies

```sh
git clone https://github.com/usstm/usstm-portal.git
cd usstm-portal
nvm use
pnpm install
```

### 2. Configure Environment Variables

Create a local environment configuration by copying [`.env.example`](.env.example):

```sh
cp .env.example .env.local
```

#### Generate Session Signing Keys

Generate an ECDSA P-256 keypair for signing session tokens:

```sh
pnpm --filter @usstm/auth generate:session-key
```

Copy the generated private JWK to `AUTH_SESSION_PRIVATE_JWK` and the public JWK to `PORTAL_AUTH_PUBLIC_JWK` in `.env.local`.

#### Google OAuth Credentials

Configure Google OAuth in `AUTH_CLIENTS` within `.env.local`:

- Create an OAuth 2.0 Client ID in Google Cloud Console.
- Set Authorized JavaScript origins to `http://localhost:3000`.
- Set Authorized redirect URI to `http://localhost:3001/auth/callback/google`.
- Update `clientId` and `clientSecret` in the `AUTH_CLIENTS` JSON array.

#### Superuser Setup

Set `PORTAL_SUPERUSER_EMAIL` in `.env.local` to the email address authorized to bootstrap initial administrators.

### 3. Start Local Database & Run Migrations

Start the local PostgreSQL 17 container:

```sh
pnpm db:up
```

Run Drizzle database schema migrations:

```sh
pnpm db:migrate
```

### 4. Start Development Servers

Start both `@usstm/portal` and `@usstm/auth` concurrently in development mode:

```sh
pnpm dev
```

- **Portal Web App**: [http://localhost:3000](http://localhost:3000)
- **Auth Service**: [http://localhost:3001](http://localhost:3001)

---

## Common Scripts

The root `package.json` provides scripts to manage all workspace packages:

| Command                  | Description                                                                                   |
| :----------------------- | :-------------------------------------------------------------------------------------------- |
| `pnpm dev`               | Run `@usstm/portal` and `@usstm/auth` in parallel development mode                            |
| `pnpm build`             | Build all workspace applications for production                                               |
| `pnpm lint`              | Lint code across all workspaces with ESLint                                                   |
| `pnpm format`            | Check code formatting with Prettier                                                           |
| `pnpm format:write`      | Auto-format files with Prettier                                                               |
| `pnpm typecheck`         | Run TypeScript type checking across all workspaces                                            |
| `pnpm test`              | Run unit tests across all workspaces with Vitest                                              |
| `pnpm test:integration`  | Run workspace integration test suites                                                         |
| `pnpm db:up`             | Spin up local PostgreSQL container via Docker Compose                                         |
| `pnpm db:migrate`        | Apply pending Drizzle migrations to local database                                            |
| `pnpm db:test:up`        | Spin up dedicated test database container                                                     |
| `pnpm db:test:reset`     | Reset and re-seed the test database                                                           |
| `pnpm ci`                | Run the complete CI verification pipeline (format, lint, typecheck, migrations, tests, build) |
| `pnpm deploy:production` | Execute the production deployment script ([`deployment/deploy.sh`](deployment/deploy.sh))     |

---

## Domain Model & Terminology

This project enforces strict domain boundaries. Please refer to [`CONTEXT.md`](CONTEXT.md) before contributing:

- **Member**: An individual person admitted to the portal. Avoid _user_, _account_, or _club account_.
- **Active Member / Deactivated Member**: Members with active grants vs. deactivated members whose past activity remains attributed.
- **Club**: An organization associated with USSTM. Avoid _group account_.
- **USSTM Club**: The protected club representing USSTM itself.
- **Club Access**: Authority granted to a member for a specific club.
- **Board Member**: A member authorized to staff Office Hours and manage shift bookings.
- **Shift Slot / Shift / Booking**: Recurring intervals, specific dated occurrences, and reservations by board members.
- **Administrator**: A member authorized to manage clubs, events, members, resources, and bookings.
- **Superuser**: Single deployment-owned identity managing administrators.
- **Audit Entry**: Immutable record attributing administrative modifications.

---

## Documentation

- **Domain Model**: [`CONTEXT.md`](CONTEXT.md)
- **Architecture Decision Records (ADRs)**: [`docs/adr/`](docs/adr/)
- **Public Events API Specification**: [`docs/api/events.md`](docs/api/events.md)
- **Production Deployment Guide**: [`docs/production-deployment.md`](docs/production-deployment.md)
- **Agent Guidelines & Issue Tracking**: [`docs/agents/`](docs/agents/) and [`AGENTS.md`](AGENTS.md)

---

## Production Deployment

The production stack runs Caddy (automated TLS reverse proxy), Portal (Nitro), Auth (Hono), PostgreSQL 17, and an automated restic nightly backup service on a single Docker host.

To deploy or update production:

```sh
pnpm deploy:production
```

For complete setup requirements, backup restoration, and health checks, see the [Production Deployment Guide](docs/production-deployment.md).
