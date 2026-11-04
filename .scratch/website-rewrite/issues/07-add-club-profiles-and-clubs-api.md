# 07 — Add Club Profiles and the public Clubs API

**What to build:** Let Clubs carry a public Club Profile (image, description, type and links), maintained in the Portal, and expose active Clubs through a public endpoint.

**Blocked by:** None — can start immediately

**Status:** ready-for-human

- [x] Club Profile fields cover an image, description, type, Instagram, website and contact email, all optional.
- [x] Members with that Club's Club Access, and Administrators, edit the Club Profile and upload its image. Only Administrators rename or archive a Club.
- [x] Images are stored in S3-compatible storage with size and type limits; the Portal CSP allows them.
- [x] `GET /api/v1/clubs` returns active Clubs with their Club Profiles and excludes Archived Clubs. It follows the Events API conventions and is documented in `docs/api/clubs.md`.
- [x] Club Profile edits are audited if ADR-0010 classes them as privileged; otherwise record why not.
- [x] Integration tests cover authorization, archived exclusion, and the documented contract.

## Comments

- Fields: `type` is `student_group` or `course_union` (the Website's StudentGroups options), `description` is plain text up to 1000 characters, Instagram stores the handle without `@`, the website must be `https://`, and the existing contact email is reused. The database enforces the same rules. Migration `0016_add-club-profiles`.
- Editing: a new **Club Profiles** page (`/club-profiles`) shows Club Access holders their own active Clubs and Administrators every active Club. Renaming and archiving stay on the Administrator-only Clubs page.
- Images: `src/storage/images.ts` writes to a private S3-compatible bucket (`PORTAL_S3_*`) through `aws4fetch`. JPEG, PNG or WebP only, detected from the file's bytes rather than its name or content type, and at most 2 MB. The Portal serves images at `/api/v1/club-images/<id>` only while an active Club uses them, so they are same-origin and the existing CSP allows them. The Portal's Caddy body limit rose from 1 MB to 3 MB to fit uploads. Ticket 09 can reuse the same storage.
- Audit (recorded in ADR-0010): as with Events, changes by Administrators and the Superuser are audited (`club.profile_updated`, `club.image_replaced`, `club.image_removed`), and changes through Club Access are not.
- `GET /api/v1/clubs` leaves out the USSTM Club, which represents USSTM itself rather than an associated organization (decided while building ticket 08).
- `imageUrl` is a path on the Portal origin. The Website proxies it at `/club-images/<id>` (ticket 08), so neither CSP needs another origin.
- Needs a human:
  - Create the bucket and set `PORTAL_S3_*` on the host.
  - Apply migration `0016`.
  - Run the integration and deployment tests (no Docker where this was built).
  - Upload an image through `/club-profiles` in a browser.
