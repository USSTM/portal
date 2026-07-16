# 12 — Override Events as an Administrator

**What to build:** Global Event management for Administrators and the Superuser, with stricter historical rules and complete privileged-action attribution.

**Blocked by:** 03 — Let the Superuser provision Administrators; 11 — Attribute Organizing Clubs

**Status:** ready-for-agent

- [ ] Administrators and the Superuser can create and edit Events for any active Club.
- [ ] They can transfer an Event to another active Owning Club without duplicating it in the organizer list.
- [ ] They can correct completed Events but cannot delete completed Events.
- [ ] They can delete only Events that have not started, with confirmation.
- [ ] Every Event creation, edit, ownership transfer, organizer change, and deletion performed with Administrator or Superuser authority creates an Audit Entry.
- [ ] Ordinary Event mutations performed through Club Access remain outside the append-only audit log.
- [ ] Personal creator and last-editor attribution is available to Administrators and the Superuser but not ordinary Members.
- [ ] Integration tests cover global authority, transfer rules, completed-Event correction, deletion limits, and audit inclusion/exclusion.

