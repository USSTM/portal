import { and, asc, eq, sql } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import { boardMembers, boardPositionOrder, members } from '../../db/schema.js'
import { getImageStore } from '../../storage/images.js'
import { memberPhotoKey } from '../member-profiles/member-profiles.js'

import { boardPhotoPath } from './board-photo-path.js'

// The current board for `GET /api/v1/board` (docs/api/board.md). A Member
// Profile is public only while its Member is an active Board Member, and only
// the display name, Board Position, bio and photo are published: never an
// email, Member ID or other personal data.

export async function listPublicBoard() {
  const rows = await getDb()
    .select({
      bio: members.bio,
      boardPosition: boardMembers.boardPosition,
      displayName: members.displayName,
      photoId: members.photoId,
    })
    .from(boardMembers)
    .innerJoin(members, eq(members.id, boardMembers.memberId))
    .leftJoin(
      boardPositionOrder,
      eq(boardPositionOrder.boardPosition, boardMembers.boardPosition),
    )
    .where(eq(members.lifecycle, 'active'))
    .orderBy(
      sql`${boardPositionOrder.displayOrder} asc nulls last`,
      asc(boardMembers.boardPosition),
      asc(members.displayName),
      asc(members.id),
    )
  return {
    boardMembers: rows.map(({ photoId, ...member }) => ({
      ...member,
      photoUrl: photoId ? boardPhotoPath(photoId) : null,
    })),
  }
}

/** Serves a photo only while its Member is an active Board Member. */
export async function readPublicBoardPhoto(photoId: string) {
  const found = await getDb()
    .select({ id: members.id })
    .from(members)
    .innerJoin(boardMembers, eq(boardMembers.memberId, members.id))
    .where(and(eq(members.photoId, photoId), eq(members.lifecycle, 'active')))
  if (found.length === 0) return undefined
  return getImageStore().get(memberPhotoKey(photoId))
}

/**
 * The current Board Positions, in Website order, for Administrators to reorder.
 * Positions that no current Board Member holds are not listed.
 */
export async function listBoardPositionOrder() {
  const rows = await getDb()
    .selectDistinct({
      boardPosition: boardMembers.boardPosition,
      displayOrder: boardPositionOrder.displayOrder,
    })
    .from(boardMembers)
    .innerJoin(members, eq(members.id, boardMembers.memberId))
    .leftJoin(
      boardPositionOrder,
      eq(boardPositionOrder.boardPosition, boardMembers.boardPosition),
    )
    .where(eq(members.lifecycle, 'active'))
  return rows
    .sort(
      (a, b) =>
        (a.displayOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.displayOrder ?? Number.MAX_SAFE_INTEGER) ||
        a.boardPosition.localeCompare(b.boardPosition),
    )
    .map((row) => row.boardPosition)
}

/**
 * Replaces the Website order of Board Positions. It changes presentation only,
 * not any Member or grant, so it is not audited (ADR-0010).
 */
export async function setBoardPositionOrder(positions: string[]) {
  const ordered = positions.map((position) => position.trim())
  if (ordered.some((position) => position.length === 0)) {
    throw new Error('Board Positions must not be blank')
  }
  if (new Set(ordered).size !== ordered.length) {
    throw new Error('Each Board Position may appear only once')
  }
  const db = getDb()
  await db.transaction(async (tx) => {
    await tx.delete(boardPositionOrder)
    if (ordered.length > 0) {
      await tx.insert(boardPositionOrder).values(
        ordered.map((boardPosition, displayOrder) => ({
          boardPosition,
          displayOrder,
        })),
      )
    }
  })
}

export function requireBoardOrderAuthority(identity: PortalIdentity) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Access denied')
}
