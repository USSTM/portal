# Manage private Resources

Type: AFK  
Label: `ready-for-agent`

## What to build

Replace hardcoded Finance and Operations links with categorized, ordered, administrator-managed Resources visible only to authenticated portal identities.

## Acceptance criteria

- [ ] Administrator can create, edit, reorder, categorize, activate, and deactivate Resource.
- [ ] Initial categories support Finance and Operations without hardcoding individual links.
- [ ] Authenticated identity sees active Resources in configured order.
- [ ] Anonymous request and direct API call cannot read Resources.
- [ ] Non-administrator cannot mutate Resource.
- [ ] Changes are included in portal audit history.

## Blocked by

- [02-sign-into-portal-through-central-google-sso.md](./02-sign-into-portal-through-central-google-sso.md)
- [04-use-unified-audit-history.md](./04-use-unified-audit-history.md)
