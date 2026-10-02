# 08 — Read Clubs from the Portal on the Website

**What to build:** Replace the Website's StudentGroups collection with Clubs read from `GET /api/v1/clubs`.

**Blocked by:** 07 — Add Club Profiles and the public Clubs API

**Status:** ready-for-agent

- [ ] A Clubs directory block renders Portal Clubs with their Club Profile image, description and links.
- [ ] Existing Student Group details (logo, description, socials, type) are copied once into the matching Portal Club Profiles. Unmatched groups are listed for a human to resolve.
- [ ] The StudentGroups collection is removed with a migration, and Pages using it are switched to the new block.
- [ ] The Website shows an empty state when the Portal is unavailable.
