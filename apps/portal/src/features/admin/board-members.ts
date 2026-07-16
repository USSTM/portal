import { count, desc, eq, isNull } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import {
  administrators,
  auditEntries,
  boardMembers,
  clubAccess,
  members,
} from '../../db/schema.js'
import {
  cancelFutureBookingsForMember,
  updateFutureBookingSnapshots,
} from '../office-hours/bookings.js'

type BoardMemberInput = { actorEmail: string; memberId: string }

export async function createMemberWithBoardAuthority(input: {
  actorEmail: string
  boardPosition: string
  displayName: string
  email: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [member] = await tx
      .insert(members)
      .values({
        displayName: input.displayName.trim(),
        email: normalizeEmail(input.email),
      })
      .returning()
    await tx.insert(boardMembers).values({
      boardPosition: input.boardPosition.trim(),
      memberId: member.id,
    })
    await writeAudit(tx, input.actorEmail, 'board_member.created', member.id, {
      boardPosition: input.boardPosition.trim(),
      displayName: member.displayName,
      email: member.email,
    })
    return member
  })
}

export async function grantBoardAuthority(
  input: BoardMemberInput & { boardPosition: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const member = await requireNonAdministratorMember(tx, input.memberId)
    await tx.insert(boardMembers).values({
      boardPosition: input.boardPosition.trim(),
      memberId: input.memberId,
    })
    if (member.lifecycle === 'deactivated') {
      await tx
        .update(members)
        .set({ lifecycle: 'active', updatedAt: new Date() })
        .where(eq(members.id, input.memberId))
    }
    await writeAudit(
      tx,
      input.actorEmail,
      'board_member.granted',
      input.memberId,
      {
        boardPosition: input.boardPosition.trim(),
        lifecycle:
          member.lifecycle === 'deactivated' ? 'active' : member.lifecycle,
      },
    )
  })
}

export async function updateBoardMember(
  input: BoardMemberInput & { boardPosition: string; displayName: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireNonAdministratorMember(tx, input.memberId)
    await requireBoardMember(tx, input.memberId)
    await tx
      .update(members)
      .set({ displayName: input.displayName.trim(), updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
    await tx
      .update(boardMembers)
      .set({ boardPosition: input.boardPosition.trim() })
      .where(eq(boardMembers.memberId, input.memberId))
    await updateFutureBookingSnapshots(tx, {
      boardPosition: input.boardPosition.trim(),
      displayName: input.displayName.trim(),
      memberId: input.memberId,
    })
    await writeAudit(
      tx,
      input.actorEmail,
      'board_member.updated',
      input.memberId,
      {
        boardPosition: input.boardPosition.trim(),
        displayName: input.displayName.trim(),
      },
    )
  })
}

export async function revokeBoardAuthority(input: BoardMemberInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireNonAdministratorMember(tx, input.memberId)
    await requireBoardMember(tx, input.memberId)
    const cancelledFutureBookings = await cancelFutureBookingsForMember(
      tx,
      input.memberId,
    )
    await tx
      .delete(boardMembers)
      .where(eq(boardMembers.memberId, input.memberId))
    const [{ total: clubGrantCount }] = await tx
      .select({ total: count() })
      .from(clubAccess)
      .where(eq(clubAccess.memberId, input.memberId))
    if (clubGrantCount === 0) {
      await tx
        .update(members)
        .set({ lifecycle: 'deactivated', updatedAt: new Date() })
        .where(eq(members.id, input.memberId))
    }
    await writeAudit(
      tx,
      input.actorEmail,
      'board_member.revoked',
      input.memberId,
      {
        cancelledFutureBookings,
        deactivated: clubGrantCount === 0,
      },
    )
  })
}

export async function browseBoardMembers() {
  return getDb()
    .select({
      boardPosition: boardMembers.boardPosition,
      displayName: members.displayName,
      email: members.email,
      memberId: members.id,
    })
    .from(boardMembers)
    .innerJoin(members, eq(members.id, boardMembers.memberId))
    .leftJoin(administrators, eq(administrators.memberId, members.id))
    .where(isNull(administrators.memberId))
    .orderBy(desc(members.updatedAt), desc(members.id))
}

export function requireBoardMemberAdministrationAuthority(
  identity: PortalIdentity,
) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Access denied')
}

async function requireNonAdministratorMember(
  tx: Transaction,
  memberId: string,
  lifecycle?: 'active' | 'deactivated',
) {
  const found = await tx
    .select({
      administratorId: administrators.memberId,
      lifecycle: members.lifecycle,
    })
    .from(members)
    .leftJoin(administrators, eq(administrators.memberId, members.id))
    .where(eq(members.id, memberId))
  if (
    found.length === 0 ||
    found[0].administratorId ||
    (lifecycle && found[0].lifecycle !== lifecycle)
  ) {
    throw new Error('Member not available for administration')
  }
  return found[0]
}

async function requireBoardMember(tx: Transaction, memberId: string) {
  const grants = await tx
    .select({ memberId: boardMembers.memberId })
    .from(boardMembers)
    .where(eq(boardMembers.memberId, memberId))
  if (grants.length === 0) throw new Error('Board Member not found')
}

type Transaction = Parameters<
  ReturnType<typeof getDb>['transaction']
>[0] extends (tx: infer InferredTransaction) => unknown
  ? InferredTransaction
  : never

async function writeAudit(
  tx: Transaction,
  actorEmail: string,
  action: string,
  targetId: string,
  changedValues: Record<string, unknown>,
) {
  await tx.insert(auditEntries).values({
    action,
    actorEmail: normalizeEmail(actorEmail),
    changedValues,
    targetId,
    targetType: 'member',
  })
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
