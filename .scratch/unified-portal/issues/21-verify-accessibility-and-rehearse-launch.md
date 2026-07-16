# 21 — Verify accessibility and rehearse launch

**What to build:** A launch-readiness pass that demonstrates accessibility, migration safety, operational recovery, and one coordinated production cutover.

**Blocked by:** 04 — Browse privileged Audit History; 08 — Complete the authenticated member shell; 18 — Import legacy Clubs and Events; 20 — Harden application security

**Status:** ready-for-agent

- [ ] All public, Member, Board Member, Administrator, and Superuser workflows meet the WCAG 2.2 AA target for keyboard use, focus, labels, errors, contrast, reduced motion, and narrow screens.
- [ ] No state or permission is communicated by color alone.
- [ ] Formatting, ESLint, typecheck, unit tests, PostgreSQL integration tests, empty-database migration, and both production builds pass together.
- [ ] A representative production-like migration rehearsal validates preserved UUIDs, counts, relationships, timestamps, and public API output.
- [ ] A backup is created and successfully restored into a clean PostgreSQL instance.
- [ ] Required production domains, OAuth settings, keys, Superuser email, Contact values, Resource values, database credentials, backup credentials, and migration export are documented as launch inputs.
- [ ] The cutover runbook covers maintenance mode, final export, idempotent import, validation, launch, legacy retirement, and failure handling without dual writes.
- [ ] The launch plan deploys all modules together and does not operate partial integrations between old and new applications.

