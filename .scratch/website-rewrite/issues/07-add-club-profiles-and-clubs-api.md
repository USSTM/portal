# 07 — Add Club Profiles and the public Clubs API

**What to build:** Let Clubs carry a public Club Profile (image, description, type and links), maintained in the Portal, and expose active Clubs through a public endpoint.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Club Profile fields cover an image, description, type, Instagram, website and contact email, all optional.
- [ ] Members with that Club's Club Access, and Administrators, edit the Club Profile and upload its image. Only Administrators rename or archive a Club.
- [ ] Images are stored in S3-compatible storage with size and type limits; the Portal CSP allows them.
- [ ] `GET /api/v1/clubs` returns active Clubs with their Club Profiles and excludes Archived Clubs. It follows the Events API conventions and is documented in `docs/api/clubs.md`.
- [ ] Club Profile edits are audited if ADR-0010 classes them as privileged; otherwise record why not.
- [ ] Integration tests cover authorization, archived exclusion, and the documented contract.
