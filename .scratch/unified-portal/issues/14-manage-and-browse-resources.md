# 14 — Manage and browse Resources

**What to build:** A deliberately small Resource editor for Administrators and a private Finance and Operations link directory for admitted identities.

**Blocked by:** 03 — Let the Superuser provision Administrators; 06 — Provision Members with Club Access

**Status:** ready-for-agent

- [x] A Resource has only category, title, plain-text description, HTTPS URL, integer display order, active state, and timestamps.
- [x] Categories are fixed to Finance and Operations.
- [x] Administrators and the Superuser can create, edit, reorder, activate, and deactivate Resources.
- [x] Active Members and the Superuser can browse active Resources in category and display order; inactive Resources remain visible only in Administration.
- [x] The five legacy Finance and four legacy Operations links are seeded as active records in their existing order.
- [x] Resource mutations create Audit Entries.
- [x] The feature has no hard delete, rich text, uploads, nested categories, scheduling, version history, drag-and-drop requirement, or Club scoping.
- [x] Unit and integration tests cover validation, ordering, visibility, authorization, seeding, and audit creation.
