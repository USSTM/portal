# Harden and launch production deployment

Type: HITL  
Label: `ready-for-human`

## What to build

Deploy hardened independent auth and portal images on one USSTM-controlled Linux host through Docker Compose and Caddy, configure production domains and Google credentials, establish backups and operational checks, then replace legacy portal with empty new system.

## Acceptance criteria

- [ ] `auth.usstm.ca` and `portal.usstm.ca` serve valid HTTPS with host-only secure cookies.
- [ ] PostgreSQL is not publicly reachable; services use least-privilege database roles.
- [ ] Secrets live outside repository and production logs redact sensitive values.
- [ ] Structured JSON logs, request IDs, and health/readiness checks work across services.
- [ ] Weekly encrypted off-host backups retain eight weeks; manual pre-migration snapshot documented.
- [ ] Restore procedure is tested and quarterly restore reminder documented.
- [ ] Production Google callback configuration and initial administrator bootstrap verified.
- [ ] Unit, PostgreSQL integration, and API contract suites pass.
- [ ] Manual responsive/WCAG review covers critical flows.
- [ ] New portal replaces legacy system at current portal URL with no data migration or parallel legacy mode.

## Blocked by

- [04-use-unified-audit-history.md](./04-use-unified-audit-history.md)
- [07-collaboratively-manage-events.md](./07-collaboratively-manage-events.md)
- [08-browse-and-protect-past-events.md](./08-browse-and-protect-past-events.md)
- [11-administer-bookings.md](./11-administer-bookings.md)
- [12-manage-private-resources.md](./12-manage-private-resources.md)
- [13-publish-usstm-contact-information.md](./13-publish-usstm-contact-information.md)
