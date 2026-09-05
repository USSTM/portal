import { and, eq, inArray } from 'drizzle-orm'

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
import { requireUsstmClub } from './clubs.js'
import { wasEverAdministrator } from './administrator-history.js'

type AdministratorInput = {
  actorEmail: string
  memberId: string
}

export async function editAdministrator(
  input: AdministratorInput & {
    confirmed: boolean
    displayName: string
    email: string
  },
) {
  const db = getDb()
  const email = normalizeEmail(input.email)

  return db.transaction(async (tx) => {
    const current = await requireAdministrator(tx, input.memberId)
    if (!input.confirmed && current.email !== email) {
      throw new Error('Email change requires confirmation')
    }
    const [member] = await tx
      .update(members)
      .set({ displayName: input.displayName.trim(), email, updatedAt: new Date() })
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
    await writeAudit(tx, input.actorEmail, 'administrator.updated', member.id, {
      displayName: member.displayName,
      email: member.email,
    })
    return member
  })
}

export async function deactivateAdministrator(input: AdministratorInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
    const cancelledFutureBookings = await cancelFutureBookingsForMember(
      tx,
      input.memberId,
    )
    await tx.delete(clubAccess).where(eq(clubAccess.memberId, input.memberId))
    await tx
      .delete(boardMembers)
      .where(eq(boardMembers.memberId, input.memberId))
    await tx
      .delete(administrators)
      .where(eq(administrators.memberId, input.memberId))
    await tx
      .update(members)
      .set({ lifecycle: 'deactivated', updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
    await writeAudit(tx, input.actorEmail, 'administrator.deactivated', input.memberId, {
      administratorGrant: false,
      cancelledFutureBookings,
      lifecycle: 'deactivated',
      revokedAllGrants: true,
    })
  })
}

export async function reactivateAdministrator(
  input: AdministratorInput & { administrator: boolean; clubIds: string[] },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireFormerAdministrator(tx, input.memberId)
    const foundMembers = await tx
      .select({ lifecycle: members.lifecycle })
      .from(members)
      .where(eq(members.id, input.memberId))
    if (foundMembers.length === 0 || foundMembers[0].lifecycle !== 'deactivated') {
      throw new Error('Member not available for reactivation')
    }

    const requestedClubIds = [...new Set(input.clubIds)]
    if (input.administrator) {
      const usstm = await requireUsstmClub(tx)
      if (!requestedClubIds.includes(usstm.id)) requestedClubIds.push(usstm.id)
    }
    if (requestedClubIds.length === 0 && !input.administrator) {
      throw new Error('At least one grant is required')
    }
    if (requestedClubIds.length > 0) {
      const activeClubs = await tx
        .select({ id: clubs.id })
        .from(clubs)
        .where(
          and(
            inArray(clubs.id, requestedClubIds),
            eq(clubs.lifecycle, 'active'),
          ),
        )
      if (activeClubs.length !== requestedClubIds.length) {
        throw new Error('Club Access requires active Clubs')
      }
    }

    await tx
      .update(members)
      .set({ lifecycle: 'active', updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
    if (requestedClubIds.length > 0) {
      await tx
        .insert(clubAccess)
        .values(
          requestedClubIds.map((clubId) => ({ clubId, memberId: input.memberId })),
        )
    }
    if (input.administrator) {
      await tx.insert(administrators).values({ memberId: input.memberId })
    }
    await writeAudit(tx, input.actorEmail, 'administrator.reactivated', input.memberId, {
      administratorGrant: input.administrator,
      clubIds: requestedClubIds,
      restoredPreviousAccess: false,
    })
  })
}

export async function grantAdministrator(input: AdministratorInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const foundMembers = await tx
      .select()
      .from(members)
      .where(eq(members.id, input.memberId))
    if (foundMembers.length === 0 || foundMembers[0].lifecycle !== 'active') {
      throw new Error('Only an active Member can become an Administrator')
    }
    const usstm = await requireUsstmClub(tx)
    const existingAccess = await tx
      .select({ memberId: clubAccess.memberId })
      .from(clubAccess)
      .where(
        and(
          eq(clubAccess.memberId, input.memberId),
          eq(clubAccess.clubId, usstm.id),
        ),
      )
    await tx.insert(administrators).values({ memberId: input.memberId })
    if (existingAccess.length === 0) {
      await tx
        .insert(clubAccess)
        .values({ clubId: usstm.id, memberId: input.memberId })
    }
    await writeAudit(tx, input.actorEmail, 'administrator.granted', input.memberId, {
      administratorGrant: true,
      usstmClubAccessGranted: existingAccess.length === 0,
    })
  })
}

export async function revokeAdministrator(input: AdministratorInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
    await tx
      .delete(administrators)
      .where(eq(administrators.memberId, input.memberId))
    await writeAudit(tx, input.actorEmail, 'administrator.revoked', input.memberId, {
      administratorGrant: false,
    })
  })
}

export async function grantClubAccessToAdministrator(
  input: AdministratorInput & { clubId: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
    await requireActiveClub(tx, input.clubId)
    await tx
      .insert(clubAccess)
      .values({ clubId: input.clubId, memberId: input.memberId })
    await writeAudit(tx, input.actorEmail, 'club_access.granted', input.memberId, {
      clubId: input.clubId,
    })
  })
}

export async function revokeClubAccessFromAdministrator(
  input: AdministratorInput & { clubId: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
    const usstm = await requireUsstmClub(tx)
    if (input.clubId === usstm.id) {
      throw new Error(
        'USSTM Club Access cannot be revoked while the Administrator grant is held',
      )
    }
    await tx
      .delete(clubAccess)
      .where(
        and(
          eq(clubAccess.memberId, input.memberId),
          eq(clubAccess.clubId, input.clubId),
        ),
      )
    await writeAudit(tx, input.actorEmail, 'club_access.revoked', input.memberId, {
      clubId: input.clubId,
    })
  })
}

export async function grantBoardPositionToAdministrator(
  input: AdministratorInput & { boardPosition: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
    await tx.insert(boardMembers).values({
      boardPosition: input.boardPosition.trim(),
      memberId: input.memberId,
    })
    await writeAudit(tx, input.actorEmail, 'board_member.granted', input.memberId, {
      boardPosition: input.boardPosition.trim(),
    })
  })
}

export async function updateAdministratorBoardPosition(
  input: AdministratorInput & { boardPosition: string; displayName: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
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
    await writeAudit(tx, input.actorEmail, 'board_member.updated', input.memberId, {
      boardPosition: input.boardPosition.trim(),
      displayName: input.displayName.trim(),
    })
  })
}

export async function revokeBoardPositionFromAdministrator(
  input: AdministratorInput,
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
    await requireBoardMember(tx, input.memberId)
    const cancelledFutureBookings = await cancelFutureBookingsForMember(
      tx,
      input.memberId,
    )
    await tx
      .delete(boardMembers)
      .where(eq(boardMembers.memberId, input.memberId))
    await writeAudit(tx, input.actorEmail, 'board_member.revoked', input.memberId, {
      cancelledFutureBookings,
    })
  })
}

async function requireActiveClub(tx: Transaction, clubId: string) {
  const found = await tx
    .select({ id: clubs.id })
    .from(clubs)
    .where(and(eq(clubs.id, clubId), eq(clubs.lifecycle, 'active')))
  if (found.length === 0) throw new Error('Club Access requires an active Club')
}

async function requireFormerAdministrator(tx: Transaction, memberId: string) {
  if (!(await wasEverAdministrator(tx, memberId))) {
    throw new Error('Administrator not found')
  }
}

async function requireAdministrator(tx: Transaction, memberId: string) {
  const found = await tx
    .select({ email: members.email, memberId: administrators.memberId })
    .from(administrators)
    .innerJoin(members, eq(members.id, administrators.memberId))
    .where(eq(administrators.memberId, memberId))
  if (found.length === 0) throw new Error('Administrator not found')
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
