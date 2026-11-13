# 08 — Read Clubs from the Portal on the Website

**What to build:** Replace the Website's StudentGroups collection with Clubs read from `GET /api/v1/clubs`.

**Blocked by:** 07 — Add Club Profiles and the public Clubs API

**Status:** ready-for-human

- [x] A Clubs directory block renders Portal Clubs with their Club Profile image, description and links.
- [x] Existing Student Group details (logo, description, socials, type) are copied once into the matching Portal Club Profiles. Unmatched groups are listed for a human to resolve.
- [x] The StudentGroups collection is removed with a migration, and Pages using it are switched to the new block.
- [x] The Website shows an empty state when the Portal is unavailable.

## Comments

- The **Clubs Directory** block (`clubsDirectory`) has a heading, an optional introduction and a filter for all Clubs, Student Groups or Course Unions. It shows each Club's image, short name, type, description and Instagram, website and email links. It reads `GET /api/v1/clubs` through `src/lib/portal-clubs.ts`, which returns no Clubs, and so the empty state, when the Portal is unreachable or answers with an error.
- Images are proxied through the Website at `/club-images/<id>`, so the Website CSP needs no Portal origin.
- `GET /api/v1/clubs` now leaves out the USSTM Club, which represents USSTM itself rather than an associated organization.
- No Page or frontend route used StudentGroups, so there were no Pages to switch. Content Managers add the new block where a directory is wanted.
- Migrations: `add_clubs_directory_block`, then `remove_student_groups`, split to avoid drizzle-kit's interactive rename prompt. `remove_student_groups` first copies the rows, with each logo's media file name, into `student_groups_archive`, because deploys run migrations before anyone could run the copy. It was also reordered: the generated SQL dropped the table with CASCADE before dropping the constraint that referenced it.
- The copy: the Website's `export:student-groups` writes JSON from the archive. The Portal's `db:import-club-profiles` matches each group to an active Club by short name, then full name. It prints a dry run, and with `--apply` it fills only empty profile fields, copies the logo when the Club has no image, and audits as the Superuser. Inactive, unknown, ambiguous and duplicate groups are reported as `unmatched`, and invalid values (an http website, a bad handle, a description over 1000 characters) are reported as `skipped`. Runbook: "Copy Website data into the Portal" in `docs/production-deployment.md`, using `deployment/compose.website-data-copy.yaml` (renamed in ticket 11, which reuses it for BoardHistory).
- Validated locally (November 13, 2026): both migrations apply on an empty database. On a test home Page, the Clubs Directory block listed the Portal's Clubs; the Biology Course Union card showed its type, description, and Instagram, website and email links with the right addresses, and its logo loaded through `/club-images/<id>` byte for byte. The empty state is covered by unit tests only.
- Still to check, with the real Supabase data: the migrations against the restored database, and the Student Group copy.
- Needs a human:
  - Run the copy (dry run, then `--apply`) and resolve the `unmatched` groups.
  - Add a Clubs Directory block to the Pages that should list Clubs.
  - Afterwards, drop `student_groups_archive` with a reviewed Payload migration, as ticket 04 does for the events tables.
