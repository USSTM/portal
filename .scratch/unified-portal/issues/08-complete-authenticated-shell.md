# 08 — Complete the authenticated member shell

**What to build:** A responsive authenticated shell that gives each identity a clear entry point, accurate account information, static USSTM contacts, and navigation based on current authority.

**Blocked by:** 06 — Provision Members with Club Access; 07 — Designate Board Members

**Status:** ready-for-agent

- [ ] Authenticated identities land on a Dashboard with a greeting and simple cards for currently available modules they may access.
- [ ] Navigation derives visibility from current Club Access, Board Member, Administrator, and Superuser authority while every destination remains server-protected.
- [ ] The read-only Account page shows display name, verified email, active grants, accessible Clubs, and Board Position where applicable.
- [ ] The Superuser Account view shows only the configured email and authority description.
- [ ] The authenticated Contact page presents the configured email, Instagram, website, and Linktree with email and copy actions.
- [ ] The shell includes sign-out, responsive navigation, pending states, access-denied, not-found, and unexpected-error views.
- [ ] Validation errors appear inline, mutation feedback uses Sonner, and unexpected errors display a request ID.
- [ ] The Dashboard contains no analytics, counts, activity feed, or duplicated management controls.
- [ ] Unit and integration tests cover capability-derived navigation and page authorization.

