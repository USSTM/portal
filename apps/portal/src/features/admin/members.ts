import {
  and,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
} from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import {
  administrators,
  auditEntries,
  boardMembers,
  clubAccess,
  clubs,
  members,
} from '../../db/schema.js'
import {
  cancelFutureBookingsForMember,
  updateFutureBookingSnapshots,
} from '../office-hours/bookings.js'

type MemberInput = { actorEmail: string; memberId: string }

export async function createMemberWithClubAccess(input: {
  actorEmail: string
  clubIds: string[]
  displayName: string
  email: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const clubIds = await requireActiveClubs(tx, input.clubIds)
    const [member] = await tx
      .insert(members)
      .values({
        displayName: input.displayName.trim(),
        email: normalizeEmail(input.email),
      })
      .returning()
    await tx
      .insert(clubAccess)
      .values(clubIds.map((clubId) => ({ clubId, memberId: member.id })))
    await writeAudit(tx, input.actorEmail, 'member.created', member.id, {
      clubIds,
      displayName: member.displayName,
      email: member.email,
      lifecycle: member.lifecycle,
    })
    return member
  })
}

export async function grantClubAccess(input: MemberInput & { clubId: string }) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireNonAdministratorMember(tx, input.memberId, 'active')
    await requireActiveClubs(tx, [input.clubId])
    await tx
      .insert(clubAccess)
      .values({ clubId: input.clubId, memberId: input.memberId })
    await writeAudit(
      tx,
      input.actorEmail,
      'club_access.granted',
      input.memberId,
      {
        clubId: input.clubId,
      },
    )
  })
}

export async function revokeClubAccess(
  input: MemberInput & { clubId: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireNonAdministratorMember(tx, input.memberId)
    await tx
      .delete(clubAccess)
      .where(
        and(
          eq(clubAccess.memberId, input.memberId),
          eq(clubAccess.clubId, input.clubId),
        ),
      )
    const [{ total: clubGrantCount }] = await tx
      .select({ total: count() })
      .from(clubAccess)
      .where(eq(clubAccess.memberId, input.memberId))
    const [{ total: boardGrantCount }] = await tx
      .select({ total: count() })
      .from(boardMembers)
      .where(eq(boardMembers.memberId, input.memberId))
    if (clubGrantCount + boardGrantCount === 0) {
      await cancelFutureBookingsForMember(tx, input.memberId)
      await tx
        .update(members)
        .set({ lifecycle: 'deactivated', updatedAt: new Date() })
        .where(eq(members.id, input.memberId))
    }
    await writeAudit(
      tx,
      input.actorEmail,
      'club_access.revoked',
      input.memberId,
      {
        clubId: input.clubId,
        deactivated: clubGrantCount + boardGrantCount === 0,
      },
    )
  })
}

export async function deactivateMember(input: MemberInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireNonAdministratorMember(tx, input.memberId)
    const cancelledFutureBookings = await cancelFutureBookingsForMember(
      tx,
      input.memberId,
    )
    await tx.delete(clubAccess).where(eq(clubAccess.memberId, input.memberId))
    await tx
      .delete(boardMembers)
      .where(eq(boardMembers.memberId, input.memberId))
    await tx
      .update(members)
      .set({ lifecycle: 'deactivated', updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
    await writeAudit(
      tx,
      input.actorEmail,
      'member.deactivated',
      input.memberId,
      {
        cancelledFutureBookings,
        revokedAllGrants: true,
      },
    )
  })
}

export async function reactivateMember(
  input: MemberInput & { clubIds: string[] },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireNonAdministratorMember(tx, input.memberId, 'deactivated')
    const clubIds = await requireActiveClubs(tx, input.clubIds)
    await tx
      .update(members)
      .set({ lifecycle: 'active', updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
    await tx
      .insert(clubAccess)
      .values(clubIds.map((clubId) => ({ clubId, memberId: input.memberId })))
    await writeAudit(
      tx,
      input.actorEmail,
      'member.reactivated',
      input.memberId,
      {
        clubIds,
        restoredPreviousAccess: false,
      },
    )
  })
}

export async function editMember(
  input: MemberInput & {
    confirmed: boolean
    displayName: string
    email: string
  },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const currentMember = await requireNonAdministratorMember(
      tx,
      input.memberId,
    )
    const email = normalizeEmail(input.email)
    if (!input.confirmed && currentMember.email !== email) {
      throw new Error('Email change requires confirmation')
    }
    const [member] = await tx
      .update(members)
      .set({
        displayName: input.displayName.trim(),
        email,
        updatedAt: new Date(),
      })
      .where(eq(members.id, input.memberId))
      .returning()
    const boardMember = (
      await tx
        .select({ boardPosition: boardMembers.boardPosition })
        .from(boardMembers)
        .where(eq(boardMembers.memberId, input.memberId))
    ).at(0)
    if (boardMember) {
      await updateFutureBookingSnapshots(tx, {
        boardPosition: boardMember.boardPosition,
        displayName: member.displayName,
        memberId: member.id,
      })
    }
    await writeAudit(tx, input.actorEmail, 'member.updated', input.memberId, {
      displayName: member.displayName,
      email: member.email,
    })
    return member
  })
}

export async function browseMembers(input: {
  clubId?: string
  lifecycle?: 'active' | 'deactivated'
  search?: string
}) {
  const db = getDb()
  const filters = [
    input.lifecycle ? eq(members.lifecycle, input.lifecycle) : undefined,
    input.search ? ilike(members.email, `%${input.search.trim()}%`) : undefined,
    input.clubId
      ? exists(
          db
            .select({ memberId: clubAccess.memberId })
            .from(clubAccess)
            .where(
              and(
                eq(clubAccess.memberId, members.id),
                eq(clubAccess.clubId, input.clubId),
              ),
            ),
        )
      : undefined,
  ].filter(
    (filter): filter is NonNullable<typeof filter> => filter !== undefined,
  )
  const where = filters.length > 0 ? and(...filters) : undefined
  const memberEntries = await db
    .select({
      displayName: members.displayName,
      email: members.email,
      id: members.id,
      isBoardMember: boardMembers.memberId,
      lifecycle: members.lifecycle,
    })
    .from(members)
    .leftJoin(administrators, eq(administrators.memberId, members.id))
    .leftJoin(boardMembers, eq(boardMembers.memberId, members.id))
    .where(and(isNull(administrators.memberId), where))
    .orderBy(desc(members.updatedAt), desc(members.id))
  const memberIds = memberEntries.map((member) => member.id)
  const grants = memberIds.length
    ? await db
        .select({
          clubId: clubAccess.clubId,
          memberId: clubAccess.memberId,
          shortName: clubs.shortName,
        })
        .from(clubAccess)
        .innerJoin(clubs, eq(clubs.id, clubAccess.clubId))
        .where(inArray(clubAccess.memberId, memberIds))
    : []
  return memberEntries.map((member) => ({
    ...member,
    isBoardMember: member.isBoardMember !== null,
    grants: grants.filter((grant) => grant.memberId === member.id),
  }))
}

export function requireMemberAdministrationAuthority(identity: PortalIdentity) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Access denied')
}

async function requireActiveClubs(tx: Transaction, clubIds: string[]) {
  const distinctClubIds = [...new Set(clubIds)]
  if (distinctClubIds.length === 0)
    throw new Error('At least one Club Access grant is required')
  const activeClubs = await tx
    .select({ id: clubs.id })
    .from(clubs)
    .where(
      and(inArray(clubs.id, distinctClubIds), eq(clubs.lifecycle, 'active')),
    )
  if (activeClubs.length !== distinctClubIds.length) {
    throw new Error('Club Access requires active Clubs')
  }
  return distinctClubIds
}

async function requireNonAdministratorMember(
  tx: Transaction,
  memberId: string,
  lifecycle?: 'active' | 'deactivated',
) {
  const foundMembers = await tx
    .select({
      administratorId: administrators.memberId,
      email: members.email,
      id: members.id,
      lifecycle: members.lifecycle,
    })
    .from(members)
    .leftJoin(administrators, eq(administrators.memberId, members.id))
    .where(eq(members.id, memberId))
  if (foundMembers.length === 0) {
    throw new Error('Member not available for administration')
  }
  const member = foundMembers[0]
  if (member.administratorId || (lifecycle && member.lifecycle !== lifecycle)) {
    throw new Error('Member not available for administration')
  }
  return member
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
