# Unified USSTM Portal Specification

This specification replaces the separate legacy Portal and Office Hours applications with one USSTM web application and adds an Administration module. It is the implementation baseline agreed during the design interview.

Domain language is defined in [`CONTEXT.md`](../../CONTEXT.md). Architectural rationale is recorded in [`docs/adr/`](../../docs/adr/). The public Event contract is defined in [`docs/api/events.md`](../../docs/api/events.md).

## Goals

- Preserve all relevant legacy Portal and Office Hours workflows in one application.
- Replace shared credentials and email/password authentication with personal Google identities.
- Authorize only explicitly provisioned email addresses.
- Add simple administration for Members, grants, Clubs, Resources, Bookings, and audit history.
- Expose public Event data through a stable unauthenticated API.
- Keep code, deployment, and operations direct and maintainable.

## Non-goals

- Self-registration, invitation emails, or account acceptance flows.
- Password authentication, password storage, and password-reset flows.
- Shared Club login identities.
- Configurable roles, arbitrary permissions, or a generic grants engine.
- Cross-domain single sign-on.
- A public Event-listing page in this application.
- A configurable Office Hours schedule.
- A general CMS, file uploads, rich text, or nested Resource categories.
- Bulk administration, CSV import/export, analytics, dashboards, or charts.
- Internationalization; the initial application is English-only.
- Real-time collaboration or optimistic mutation rollbacks.
- Browser end-to-end testing.
- Kubernetes, distributed tracing, or a metrics platform.

## System Shape

Use a plain pnpm workspace:

```text
apps/
  portal/          # TanStack Start application
  auth/            # Hono Google authentication service
packages/
  auth-session/    # Session claims, signing, and verification only
```

The root pins pnpm through `packageManager`, commits one lockfile, and uses Node.js 24 LTS in development, CI, and production. Root scripts and `pnpm --filter` coordinate the workspace; do not add Turborepo or Nx.

### Portal stack

- TanStack Start and Router
- TypeScript
- React
- Tailwind CSS
- ShadCN UI with default styles and USSTM navy `#002956` as the primary color
- TanStack Query for client-visible server state and mutations
- TanStack Table for Administration tables
- React Hook Form for forms
- Zod for client and server boundary validation
- Drizzle ORM with `node-postgres`
- PostgreSQL
- Pinned Nitro Node preset for the production build

Use TanStack utilities where they directly fit a requirement. Do not add TanStack Store, Virtual, Pacer, or other packages speculatively.

### Auth stack

- Hono on Node.js
- Arctic for Google's authorization-code flow with PKCE
- Google's user-info endpoint for the verified email
- `jose` for asymmetric session JWT signing and verification
- No database, ORM, authorization data, or retained Google tokens

## Code Organization

Organize portal code by concrete feature:

```text
src/
  features/
    events/
    office-hours/
    resources/
    admin/
    account/
    contact/
  auth/
  components/
  db/
  routes/
```

Feature server functions authorize explicitly and call Drizzle directly. Share code only after multiple features genuinely need it. Do not introduce controller-service-repository layers, dependency-injection containers, command buses, generic CRUD frameworks, or a shared domain `core` package.

## Authentication

### Flow

1. An application redirects the browser to its reverse-proxied `/auth/*` route.
2. The auth service performs Google's authorization-code flow with mandatory `state` and PKCE.
3. The service accepts only a Google response containing a verified email.
4. The service trims and lowercases the complete email address. It does not strip dots, tags, aliases, or rewrite domains.
5. The service issues an eight-hour, host-only, `HttpOnly`, `Secure`, `SameSite=Lax` signed cookie.
6. The application verifies the cookie signature, issuer, audience, issued time, and expiry.
7. On every protected server request, the application looks up current authorization for that email.

The cookie contains only the normalized verified email, application audience, issued timestamp, expiry timestamp, and signing key ID. Sessions do not slide, refresh, or offer a remember-me option. Logout clears the local application cookie; no Google access or refresh token is retained.

### Reusable auth service

The same auth service may be reverse-proxied at `/auth/*` by multiple applications. Each application has an independent host-only cookie and performs its own authorization; signing into one application does not create a session in another.

Auth clients are allowlisted through deployment configuration. Each entry has a stable client ID, exact public origin, cookie audience/name, and callback path. Unknown clients, hosts, callback destinations, and non-relative post-login paths are rejected.

The auth service receives one private signing key. Applications receive only the matching public key and key ID. Initial key rotation is a coordinated deployment; there is no JWKS discovery or multi-key rotation system.

There is no fake-login endpoint. Manual local development uses a Google OAuth client configured for localhost. Tests may use dedicated test keys and seeded identities.

## Admission And Authorization

Authentication proves only control of a Google email. It grants no application authority by itself. Google account domains provide no implicit access.

An email is admitted only when it matches either:

- An Active Member provisioned in PostgreSQL with at least one current grant.
- The deployment-configured Superuser email.

Unknown or deactivated emails receive a generic access-denied response that does not reveal provisioning state.

### Fixed grants

Members may hold any combination of:

- **Club Access**: full Portal authority for one specified Club.
- **Board Member**: authority to create and cancel their own eligible Office Hours Bookings.
- **Administrator**: global authority over non-administrator Members, grants, Clubs, Events, Resources, and Bookings.

Represent grants explicitly with `club_access`, `board_members`, and `administrators` tables. Row presence grants authority. Do not create generic role, permission, or polymorphic grant tables.

### Superuser

The Superuser is one Google-authenticated email supplied through required deployment configuration. It is not a Member, cannot hold Member grants, and cannot be managed through the application.

The Superuser has every Administrator capability and exclusive authority to create or modify an Administrator, including their email, display name, Club Access, Board Member authority, Board Position, Administrator authority, and activation status. Ordinary Administrators cannot modify any Administrator record, including their own.

Changing the configured Superuser requires a deployment configuration change and restart. Superuser actions remain attributable to the verified email.

### Member lifecycle

- Creating or reactivating a Member requires at least one initial grant in the same transaction.
- Revoking a Member's final grant deactivates them.
- Deactivation blocks access, revokes every grant, and cancels every future Booking transactionally.
- Deactivated Members are not hard-deleted and retain historical attribution.
- Reactivation requires explicit new grants; prior grants are not restored.
- Provisioning is immediate and sends no invitation.
- Administrators manage Member display names and, for Board Members, Board Positions.
- Members cannot edit their own profile values or grants.
- Google profile names and photos are ignored.
- Administrators may change a non-administrator Member's normalized unique email after confirmation. The old email loses access on its next request and the new email receives the same Member ID, grants, Bookings, and history.
- Only the Superuser may change an Administrator's email or any other Administrator data.

Retain deactivated Members and other historical records indefinitely until USSTM adopts a formal retention policy.

## Authorization Enforcement

Browsers never connect directly to PostgreSQL. Every private query and mutation is protected at its server function or server route, not only in route navigation.

Use direct TypeScript checks, PostgreSQL constraints, and transactions. Do not use PostgreSQL row-level security, authorization triggers, or stored RPC functions.

Route visibility is only user experience; the server remains the security boundary.

## Database

The Portal exclusively owns one PostgreSQL database. The auth service has no database access.

Maintain a TypeScript Drizzle schema and generated SQL migrations. Review and commit migrations, and apply them explicitly during deployment. Raw SQL is allowed when constraints, transactions, or data migration are clearer than Drizzle's query API. Do not add repository classes.

### Core records

The schema must support these records and relationships:

- `members`: stable UUID, normalized unique email, display name, lifecycle state, timestamps.
- `club_access`: unique Member and Club pair.
- `board_members`: one row per authorized Member with one required Board Position.
- `administrators`: one row per Administrator Member.
- `clubs`: stable UUID, unique short name, full name, optional contact email, active/archive state, timestamps.
- `events`: stable UUID, public fields, Owning Club, timestamps, nullable creator and last-editor Member attribution, optimistic concurrency timestamp.
- `event_organizers`: unique Event and additional Organizing Club pair; never duplicate the owner.
- `shift_slots`: the four fixed Office Hours intervals.
- `bookings`: Board Member, date, Shift Slot, public name/position snapshots, timestamps, and uniqueness per Member/date/slot.
- `resources`: fixed category, title, plain-text description, HTTPS URL, display order, active state, timestamps.
- `audit_entries`: immutable privileged action records.

Use foreign keys, unique indexes, check constraints, and transactions to prevent invalid structure. Lock the affected Member transactionally when counting and changing weekly Bookings so concurrent requests cannot exceed limits.

## Events

### Domain and authority

Every Event has exactly one Owning Club and zero or more distinct Organizing Clubs. Creating an Event, transferring ownership, or adding an organizer requires an active Club, but later archiving a Club preserves its existing Event attribution. The owner is always presented as participating and is not duplicated in the additional organizers list.

A Member with Club Access to multiple Clubs chooses the Owning Club explicitly when creating an Event. There is no global active-Club selector or hidden Club context.

- Members with Club Access to the Owning Club may create and edit Event details and additional organizers.
- Organizing Clubs receive public attribution but no modification authority.
- Only an Administrator or the Superuser may transfer ownership, and only to an active Club.
- Administrators and the Superuser may manage Events for any Club.

### Lifecycle

- Creation publishes the Event immediately; there is no draft state.
- Future and ongoing Events may be edited by the Owning Club.
- Only Events that have not started may be deleted.
- After the end timestamp, Club-authorized Members may not edit or delete the Event.
- Administrators and the Superuser may correct completed Events but may not delete them.
- Event ownership transfer is audited.
- Every Event mutation performed by an Administrator or the Superuser is audited.
- Ordinary Event work performed through Club Access is not placed in the append-only audit log.
- Store nullable creator and last-editor Member references and timestamps. Migrated Events have null personal attribution.
- Use optimistic concurrency: an edit submits the last known update timestamp and fails with a reload instruction if another edit won first.
- Require confirmation before deleting an Event.

### Validation

- Title: trimmed, 3-100 characters.
- Description: trimmed, 10-1000 characters.
- Location: required plain text.
- Address: required plain text or HTTPS URL.
- Start and end: required Toronto-local date/time.
- End must be at least one hour after start.
- Owner: exactly one active Club authorized for the creating Member, unless the actor is an Administrator or Superuser.
- Additional organizers: zero or more distinct active Clubs excluding the owner.

Validate the same Zod input schema at the server boundary. Client validation is only feedback.

### Authenticated Event management

The Event area has two server-driven views:

- `Upcoming`: ongoing and future Events ordered by start ascending.
- `Past`: completed Events ordered by end descending.

One search field covers title, description, location, address, and Club names. Use URL query parameters and straightforward server-side filtering with 20-item offset pagination.

### Public Events API

There is no public Event page in this application. External sites consume `GET /api/v1/events` as specified in [`docs/api/events.md`](../../docs/api/events.md).

The endpoint is unauthenticated, accepts only `GET` and `HEAD`, allows credential-free CORS from any origin, and caches publicly for 60 seconds. It returns all Events by default or Events overlapping optional RFC 3339 `from` and `to` bounds. It never returns personal creator/editor attribution.

## Office Hours

### Schedule

Office Hours use a fixed Monday-Friday schedule with four daily intervals:

1. 10:00-12:00
2. 12:00-14:00
3. 14:00-16:00
4. 16:00-18:00

Store the intervals as seeded reference data. There is no schedule configuration UI.

### Calendar

Use one capability-aware `/office-hours` weekly calendar:

- Anonymous visitors see the public schedule with Board Member display names and Board Positions.
- Board Members see controls for their own eligible Bookings.
- Administrators and the Superuser see override controls.
- Other Active Members see the same read-only calendar.

Default to the current Toronto week. `?week=YYYY-MM-DD` normalizes the date to its Monday. Any past or future week may be viewed.

Provide previous-week, next-week, and return-to-current-week controls. The weekly calendar must remain usable on narrow screens without relying on color alone.

Multiple Board Members may book the same Shift. Enforce at most one Booking per Member, date, and Shift Slot.

### Board Member Booking rules

- At most five Bookings per Monday-Sunday week.
- Booking is allowed only in the current Toronto week or the immediately following week.
- A Shift cannot be booked or cancelled after it starts.
- A Board Member may cancel only their own future Booking.
- Enforce all rules server-side in a transaction; disabled controls are only user experience.

Do not use optimistic updates. Disable the affected control while the transaction runs, refresh Query data after success, and show an error toast on failure.

### Administrator overrides

Administrators and the Superuser may create or cancel any future Booking for a Board Member, including outside the two-week window and beyond the weekly limit. They cannot alter Booking history after a Shift starts and cannot create a Booking for an identity that is not a Board Member.

Administrator overrides create Audit Entries.

### Historical identity

Each Booking stores the public display name and Board Position used at that time while retaining its Member reference. Profile changes update snapshots on future Bookings only. Past snapshots never change. Revoking Board Member authority or deactivating the Member cancels future Bookings and preserves past Bookings.

No legacy Office Hours Board Members or Bookings are migrated.

## Resources

Resources are private external links available to every Active Member and the Superuser. They are global, not Club-scoped.

Each Resource has only:

- Fixed category: `Finance` or `Operations`.
- Title.
- Short plain-text description.
- HTTPS URL.
- Integer display order.
- Active/inactive state.

Administrators and the Superuser may create, edit, reorder, activate, and deactivate Resources. There is no rich text, upload, nested category, scheduling, version-history, or drag-and-drop requirement.

Seed the five legacy Finance and four legacy Operations links as active Resources in their existing order.

## Administration

The canonical module name is `Administration`, not User Manager. Use `Member` rather than `user` in product language, schema, routes, tests, and documentation.

Administration contains straightforward searchable tables and forms:

- **Members**: search/filter by status and grant; create, edit, grant, revoke, activate, and deactivate within authority boundaries.
- **Clubs**: search/filter by state; create, edit, archive, and reactivate.
- **Resources**: filter by category/state and manage fields and display order.
- **Bookings**: weekly calendar with Administrator overrides.
- **Audit History**: newest-first pagination with basic actor and action filters and expandable changed-value snapshots.

There are no bulk actions, import/export tools, analytics, or charts.

### Club lifecycle

Archive Clubs instead of deleting them. Archiving transactionally revokes every Club Access grant, prevents new grants and Events, and removes the Club from organizer selectors. Existing past and future Events and organizer attribution remain. Administrators retain Event management authority. Reactivation does not restore old grants.

### Audit history

Audit Entries are append-only and visible read-only to Administrators and the Superuser. Each entry stores actor email, action, target type and stable ID, timestamp, and a small JSON snapshot of changed values.

Audit:

- Member creation and profile changes.
- Member activation and deactivation.
- Grant creation and revocation.
- Administrator changes by the Superuser.
- Club creation and lifecycle changes.
- Resource changes.
- Every Event mutation performed by an Administrator or the Superuser.
- Administrator Booking overrides.

Do not audit page views, API reads, Event mutations performed through Club Access, or Board Members managing their own Bookings.

## Other Authenticated Pages

### Dashboard

Show a greeting and simple cards for accessible modules. Do not add statistics, activity feeds, announcements, or embedded management widgets.

### Account

Show a read-only view of display name, verified login email, active grants, accessible Clubs, and Board Position where applicable. Members cannot self-edit. The Superuser sees only the configured email and authority description.

### Contact

Keep Contact as static code-managed content visible to Active Members and the Superuser. Preserve the legacy email, Instagram, website, and Linktree channels. Do not add Contact editing to Administration.

Provide direct email and copy-to-clipboard actions without device-specific authorization behavior.

## Navigation

Anonymous visitors land on the public Office Hours calendar. Authenticated identities land on the Dashboard.

The shared shell exposes navigation according to capability:

- Dashboard: every Active Member and the Superuser.
- Events: Club Access, Administrator, or Superuser.
- Resources: every Active Member and the Superuser.
- Office Hours: public read access; Booking controls depend on authority.
- Administration: Administrator or Superuser.
- Contact: every Active Member and the Superuser.
- Account and Sign out: every authenticated identity.

Every destination rechecks authorization server-side regardless of navigation visibility.

## User Experience And Accessibility

- Use ShadCN default styling with only navy `#002956` as the primary color.
- Do not reproduce the legacy layout, teal palette, typography overrides, or custom component styling.
- Meet WCAG 2.2 AA as the target.
- Support keyboard navigation, visible focus, semantic labels, associated errors, sufficient contrast, reduced motion, and narrow mobile layouts.
- Do not convey calendar state through color alone.
- Prefer ShadCN/Radix behavior over custom widgets.
- Show validation errors inline.
- Use ShadCN Sonner for mutation success and non-field failures.
- Show clear route and mutation pending states.
- Provide dedicated access-denied, not-found, and unexpected-error states.
- Show request IDs on unexpected errors for log correlation.
- Do not put feedback messages in URLs.

## Time

`America/Toronto` is the sole business timezone.

- Forms accept and display Toronto local time.
- PostgreSQL stores Event instants with timezone semantics.
- The public API returns RFC 3339 timestamps with explicit offsets.
- Office Hours dates, Shift starts, and weekly limits use Toronto civil time.
- Daylight-saving behavior uses timezone data, never a fixed UTC offset.

## Security

- OAuth `state` and PKCE are mandatory.
- Require a verified Google email.
- Validate `Origin` on every state-changing request.
- Use secure, HTTP-only, host-only, `SameSite=Lax` cookies.
- Apply a restrictive Content Security Policy and standard security headers.
- Limit request-body sizes.
- Validate all external input server-side.
- Keep secrets and database access out of client bundles.
- Do not log OAuth codes, cookies, JWTs, or Google tokens.
- Return generic authentication failures that do not reveal provisioning state.

## Migration And Cutover

Migrate only:

- Every legacy Club.
- Every past and future legacy Event.
- Every Event-to-organizer relationship.

Do not migrate:

- Legacy credentials or Supabase Auth identifiers as identities.
- Sessions or password-reset state.
- Board rosters.
- Past or future Office Hours Bookings.

Preserve legacy Club and Event UUIDs. Convert legacy `users.id` values into Club IDs, `events.created_by` into the Owning Club reference, and organizer rows into additional Organizing Clubs after removing any duplicate owner relationship.

Use a one-time maintenance-window cutover:

1. Disable Event editing in the legacy Portal.
2. Export Clubs, Events, and organizers.
3. Run an idempotent import into PostgreSQL.
4. Validate record counts, UUIDs, relationships, and timestamps.
5. Open the new application and retire the legacy Portal.

Do not implement dual writes, change-data capture, legacy synchronization, or rollback synchronization.

## Deployment And Operations

Run one Docker Compose stack on one USSTM-controlled Linux host:

- Caddy terminates TLS and routes public traffic.
- The Portal and auth service run as separate private containers.
- Caddy routes each application's `/auth/*` path to the auth service.
- PostgreSQL is private and uses persistent storage.
- Only Caddy exposes public ports.
- Nightly encrypted PostgreSQL backups are copied off-host.

Provide:

- Structured JSON logs to stdout.
- A request ID propagated through Caddy, Portal, and auth.
- `/health/live` on both services.
- `/health/ready` on the Portal with a PostgreSQL connectivity check.
- Docker restart policies.

Do not add a metrics stack, distributed tracing, or an external error-monitoring service initially.

## Testing And CI

### Unit tests

Use Vitest for:

- Validation schemas.
- Toronto date and week calculations.
- Event lifecycle rules.
- Permission decisions.
- Session claim signing and verification.
- Email normalization.
- Component behavior where it carries business logic.

### Integration tests

Use Vitest against a disposable real PostgreSQL database for:

- Applying migrations from an empty database.
- Authorization queries and mutation boundaries.
- Member and Club lifecycle transactions.
- Concurrent Booking attempts and weekly limits.
- Event ownership and lifecycle behavior.
- Public Events API contract, CORS, filtering, and caching.
- Audit Entry creation and exclusions.
- Auth-service routes using a fake Google boundary and test signing keys.

Do not add Playwright or a browser automation suite.

### Required CI checks

- Formatting.
- ESLint.
- TypeScript typecheck.
- Unit tests.
- PostgreSQL integration tests.
- Production builds for Portal and auth.
- Migration application from an empty database.

Do not impose a coverage-percentage gate. Every regression and authorization rule requires a targeted test.

## Delivery

Build and verify vertical slices in this order:

1. Workspace, containers, PostgreSQL, auth, and application shell.
2. Member/Club authorization and Administration.
3. Event management, public API, and migration tooling.
4. Resources, Dashboard, Account, and Contact.
5. Office Hours calendar and Booking.
6. Security, accessibility, backups, migration rehearsal, and production cutover.

Launch all modules together after verification. Do not run partially unified production modules or integrations between the old and new applications.

## Required Operational Inputs

Implementation and launch require values that are intentionally not invented by this specification:

- Production domain and DNS configuration.
- Google OAuth client credentials and allowed callback URLs.
- Auth private signing key and Portal public verification key.
- Superuser email.
- PostgreSQL and backup credentials.
- Exact legacy Finance and Operations Resource URLs and descriptions.
- Exact Contact page values.
- A legacy Clubs, Events, and organizers export for migration rehearsal and cutover.
