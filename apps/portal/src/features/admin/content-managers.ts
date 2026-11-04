import { and, count, eq } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import {
  administrators,
  auditEntries,
  boardMembers,
  clubAccess,
  contentManagers,
  members,
} from '../../db/schema.js'

type ContentManagerInput = { actorEmail: string; memberId: string }

export async function grantContentManager(input: ContentManagerInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const member = await requireNonAdministratorMember(tx, input.memberId)
    await tx.insert(contentManagers).values({ memberId: input.memberId })
    if (member.lifecycle === 'deactivated') {
      await tx
        .update(members)
        .set({ lifecycle: 'active', updatedAt: new Date() })
        .where(eq(members.id, input.memberId))
    }
    await writeAudit(
      tx,
      input.actorEmail,
      'content_manager.granted',
      input.memberId,
      {
        lifecycle:
          member.lifecycle === 'deactivated' ? 'active' : member.lifecycle,
      },
    )
  })
}

export async function revokeContentManager(input: ContentManagerInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireNonAdministratorMember(tx, input.memberId)
    await requireContentManager(tx, input.memberId)
    await tx
      .delete(contentManagers)
      .where(eq(contentManagers.memberId, input.memberId))
    const remainingGrants = await countRemainingGrants(tx, input.memberId)
    if (remainingGrants === 0) {
      await tx
        .update(members)
        .set({ lifecycle: 'deactivated', updatedAt: new Date() })
        .where(eq(members.id, input.memberId))
    }
    await writeAudit(
      tx,
      input.actorEmail,
      'content_manager.revoked',
      input.memberId,
      {
        deactivated: remainingGrants === 0,
      },
    )
  })
}

/**
 * Administrators and the Superuser hold Content Manager authority implicitly
 * (ADR-0020); other Members need an active Member row and a grant row.
 */
export async function hasContentManagerAuthority(identity: PortalIdentity) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return true
  }
  if (identity.kind !== 'member') return false
  const found = await getDb()
    .select({ memberId: contentManagers.memberId })
    .from(contentManagers)
    .innerJoin(members, eq(members.id, contentManagers.memberId))
    .where(
      and(eq(members.email, identity.email), eq(members.lifecycle, 'active')),
    )
  return found.length > 0
}

/**
 * Resolves Content Manager authority for a verified email from another
 * application, such as a Website session. Unknown emails hold no authority.
 */
export async function hasContentManagerAuthorityForEmail(
  email: string,
  superuserEmail: string,
) {
  const normalized = normalizeEmail(email)
  if (normalized === normalizeEmail(superuserEmail)) return true
  const found = await getDb()
    .select({
      administratorId: administrators.memberId,
      contentManagerId: contentManagers.memberId,
    })
    .from(members)
    .leftJoin(administrators, eq(administrators.memberId, members.id))
    .leftJoin(contentManagers, eq(contentManagers.memberId, members.id))
    .where(and(eq(members.email, normalized), eq(members.lifecycle, 'active')))
  const member = found.at(0)
  return (
    member !== undefined &&
    (member.administratorId !== null || member.contentManagerId !== null)
  )
}

export function requireContentManagerAdministrationAuthority(
  identity: PortalIdentity,
) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Access denied')
}

async function countRemainingGrants(tx: Transaction, memberId: string) {
  const [{ total: clubGrantCount }] = await tx
    .select({ total: count() })
    .from(clubAccess)
    .where(eq(clubAccess.memberId, memberId))
  const [{ total: boardGrantCount }] = await tx
    .select({ total: count() })
    .from(boardMembers)
    .where(eq(boardMembers.memberId, memberId))
  return clubGrantCount + boardGrantCount
}

async function requireNonAdministratorMember(
  tx: Transaction,
  memberId: string,
) {
  const found = await tx
    .select({
      administratorId: administrators.memberId,
      lifecycle: members.lifecycle,
    })
    .from(members)
    .leftJoin(administrators, eq(administrators.memberId, members.id))
    .where(eq(members.id, memberId))
  if (found.length === 0 || found[0].administratorId) {
    throw new Error('Member not available for administration')
  }
  return found[0]
}

async function requireContentManager(tx: Transaction, memberId: string) {
  const grants = await tx
    .select({ memberId: contentManagers.memberId })
    .from(contentManagers)
    .where(eq(contentManagers.memberId, memberId))
  if (grants.length === 0) throw new Error('Content Manager not found')
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
