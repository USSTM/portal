# 20 — Harden application security

**What to build:** A focused security pass that verifies every external and privileged boundary across the completed application and production proxy.

**Blocked by:** 12 — Override Events as an Administrator; 13 — Expose the public Events API; 14 — Manage and browse Resources; 17 — Override Bookings and enforce Member cleanup; 19 — Build the production deployment stack

**Status:** ready-for-agent

- [ ] Every state-changing request validates its Origin and every private server function independently checks current authorization.
- [ ] A restrictive Content Security Policy and standard security headers are applied without breaking required ShadCN or OAuth behavior.
- [ ] Request-body limits and Zod validation protect every external input boundary.
- [ ] Cookies retain the agreed secure attributes, issuer/audience checks, fixed expiry, and asymmetric verification.
- [ ] Authentication errors do not disclose whether an email is provisioned.
- [ ] OAuth codes, cookies, JWTs, Google tokens, database credentials, and signing secrets never appear in logs or client bundles.
- [ ] Authorization-change checks take effect on the next request without a session revocation store.
- [ ] Integration tests exercise anonymous, Member, Board Member, Administrator, and Superuser denial paths for all protected features.

