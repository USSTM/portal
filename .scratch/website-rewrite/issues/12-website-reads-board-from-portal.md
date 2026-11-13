# 12 — Read the board and Board Archives from the Portal on the Website

**What to build:** Replace the Website's People and BoardHistory collections with the Portal board and Board Archive endpoints.

**Blocked by:** 10 — Expose the current board through a public API; 11 — Add Board Archives

**Status:** ready-for-human

- [x] The team block renders the current board from `GET /api/v1/board`.
- [x] A past-boards block renders Board Archives.
- [ ] The People and BoardHistory collections are removed with a migration, and Pages using them are switched over. **BoardHistory is removed; People is deferred to ticket 13.**
- [x] The Website shows an empty state when the Portal is unavailable.

## Comments

- **Team Grid** (`teamGrid`, kept so existing Pages keep their block) now shows the current board from `GET /api/v1/board`, in the Portal's Website order, with each Member's photo, name, Board Position and bio. Its hand-picked People and its "show contact info" option are gone: the board API never returns emails. Migration `read_board_from_portal` deletes the block's People relationships and drops those columns.
- **Past Boards** (`pastBoards`) is new. It lists Board Archives from `GET /api/v1/board-archives` newest first, each year in an accordion, with an optional limit on how many years to show.
- Both blocks read through `src/lib/portal-board.ts` and show an empty state when the Portal is unreachable or answers with an error. Board photos are proxied at `/board-photos/<id>`, which shares one proxy with `/club-images/<id>`, so the Website CSP needs no Portal origin.
- **People is not removed here.** Committees and ElectionCycles still have relationships to People, so removing it now would break them or lose committee members and election candidates. Ticket 13 turns those into plain names, so the People removal moved there.
- BoardHistory is removed by migration `remove_board_history`. Because deploys run migrations automatically, it first flattens every year, with each person's current name and position, into `board_history_archive`, and the ticket 11 export now reads that table. It was also reordered: the generated SQL dropped the tables with CASCADE before dropping the constraint that referenced them.
- Fixed while validating: Team Grid keyed its cards by position and name, and the seeded board has two "Iman Memon, Secretary" entries, so React warned about duplicate keys. Cards are now keyed by their place in the list as well.
- Validated locally (November 13, 2026): both migrations apply on an empty database. On a test home Page, Team Grid showed all 25 Board Members in the Portal's Website order (Chairperson first, as set on the Board Members page), with placeholders where no photo is set, and Past Boards showed the 2099-2100 Board Archive with its members in order. The empty state is covered by unit tests only.
- Still to check, with the real Supabase data: the migrations against the restored database, `board_history_archive` holding every year, and the BoardHistory copy (ticket 11). A Board Member's photo and bio on Team Grid were checked with ticket 09: both appeared, the photo loading through `/board-photos/<id>`.
- Needs a human:
  - Afterwards, drop `board_history_archive` with a reviewed Payload migration.
  - The seeded board lists Iman Memon as Secretary twice; check whether that is one person entered twice.
