# Publish USSTM contact information

Type: AFK  
Label: `ready-for-agent`

## What to build

Provide a public Contact page backed by administrator-managed USSTM contact settings. Denied users can reach it directly from access-failure screen.

## Acceptance criteria

- [ ] Public page supports support email, Instagram, website, and Linktree.
- [ ] USSTM Administrator can update contact settings through unified portal UI.
- [ ] Anonymous visitors and denied identities can view contact page.
- [ ] Invalid URLs/emails are rejected server-side.
- [ ] Changes are audited when audit slice exists.
- [ ] Page meets agreed responsive and WCAG 2.2 AA implementation requirements.

## Blocked by

- [01-bootstrap-deployable-monorepo.md](./01-bootstrap-deployable-monorepo.md)
