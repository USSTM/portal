# 10 — Expose the current board through a public API

**What to build:** Publish the current board, meaning Board Members with their Board Positions and public Member Profiles, for the Website.

**Blocked by:** 09 — Add Member Profiles

**Status:** ready-for-human

- [x] `GET /api/v1/board` returns each current Board Member's display name, Board Position, and Member Profile photo and bio.
- [x] Only Board Members appear; no email or other personal data is returned.
- [x] Board ordering is defined (an Administrator-set order, or a documented rule).
- [x] The contract is documented in `docs/api/board.md` and follows the Events API conventions.

## Comments

- `GET /api/v1/board` lists active Members with Board Member authority, Administrators included, as `{ displayName, boardPosition, bio, photoUrl }`. No email or Member ID is returned.
- Photos are served at `/api/v1/board-photos/<id>` only while their Member is an active Board Member, with a 5-minute cache so a photo does not linger after someone leaves the board. Revoking Board Member authority or deactivating the Member removes both the entry and the photo.
- Ordering is Administrator-set, by Board Position rather than by person: **Website Order** on the Board Members page reorders the current positions, stored in the new `board_position_order` table (migration `0018`). Ordering by position avoids an Administrator editing another Administrator's grant, and the order survives handovers. Unordered positions follow alphabetically, then display name within a shared position.
- Not audited: the order changes presentation, not any Member or grant (ADR-0010).
- Needs a human:
  - Apply migration `0018`.
  - Run `public-board.integration.test.ts` (no Docker where this was built).
  - Set the Website Order on the Board Members page.
  - Check `GET /api/v1/board` once Board Members have added photos.
