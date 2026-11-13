# 09 — Add Member Profiles

**What to build:** Let each Member maintain an optional photo and short bio on their Account page.

**Blocked by:** None — can start immediately

**Status:** ready-for-human

- [x] A Member uploads, replaces or removes their own photo, and edits a short bio with a length limit.
- [x] Photos use the same S3-compatible storage and limits as Club images (07). Whichever issue lands first sets the storage up.
- [x] No one else can edit a Member Profile, Administrators included; deactivation keeps it private.
- [x] `docs/PRIVACY.md` states that a Member Profile is public only while the Member is a Board Member.

## Comments

- Migration `0017_add-member-profiles` adds `members.photo_id` and `members.bio`. The bio is limited to 500 characters, in both the input and the database.
- Photos use ticket 07's storage (`src/storage/images.ts`, `PORTAL_S3_*`) under the `member-photos/` prefix, with the same 2 MB limit and JPEG, PNG or WebP detected from the file's bytes. Replacing or removing a photo deletes the old object.
- Ownership: the Member Profile section on the Account page uses server actions that take no Member ID and act only on the signed-in email, so no one, Administrators included, can edit another Member's profile. The Superuser is not a Member and has none.
- Privacy: no route serves photos publicly yet. The Account page shows the Member their own photo as a data URL. Ticket 10 publishes photos and bios only for current Board Members, and deactivation revokes Board Member authority, so a deactivated Member's profile stays private. Deactivated Members cannot edit their profile; it is kept.
- Audit: self-service edits are not privileged administrative mutations, so they are not audited (ADR-0010).
- `docs/PRIVACY.md` and the Portal's `/privacy` page, which keeps its own copy of the text, both describe the Member Profile, its Board Member-only visibility and what deactivation does. Both "Last Updated" dates are now October 29, 2026.
- Validated locally (November 13, 2026): migration `0017` applies and the Member Profile integration tests pass. Signed in with Google as a regular Member who is also a Board Member (`amitoz.banga@torontomu.ca`, Computer Science Director), a JPEG photo uploaded on the Account page and a bio saved. `GET /api/v1/board` then returned that entry with the bio and a photo link and only its four public fields; the photo was served by `/api/v1/board-photos/<id>` and through the Website's `/board-photos/<id>` (the same 293,664-byte JPEG, `image/jpeg`, a 5-minute public cache); and the Website's Team Grid showed the photo and bio on that card once its 60-second cache expired. Photos staying private for Members who aren't on the board, or are deactivated, is covered by the integration tests.
- Needs a human:
  - Apply migration `0017` in production.
  - Review the privacy wording before it is published.
