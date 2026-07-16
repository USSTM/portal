import { eq } from 'drizzle-orm'

import { getDb } from '../../db/index.js'
import { administrators, auditEntries, members } from '../../db/schema.js'

type AdministratorInput = {
  actorEmail: string
  memberId: string
}

export async function createAdministrator(input: {
  actorEmail: string
  displayName: string
  email: string
}) {
  const db = getDb()
  const email = normalizeEmail(input.email)

  return db.transaction(async (tx) => {
    const [member] = await tx
      .insert(members)
      .values({ displayName: input.displayName.trim(), email })
      .returning()
    await tx.insert(administrators).values({ memberId: member.id })
    await writeAudit(tx, input.actorEmail, 'administrator.created', member.id, {
      displayName: member.displayName,
      email: member.email,
      administratorGrant: true,
      lifecycle: member.lifecycle,
    })
    return member
  })
}

export async function editAdministrator(
  input: AdministratorInput & { displayName: string; email: string },
) {
  const db = getDb()
  const email = normalizeEmail(input.email)

  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
    const [member] = await tx
      .update(members)
      .set({ displayName: input.displayName.trim(), email, updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
      .returning()
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
    const [member] = await tx
      .update(members)
      .set({ lifecycle: 'deactivated', updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
      .returning()
    await tx.delete(administrators).where(eq(administrators.memberId, input.memberId))
    await writeAudit(tx, input.actorEmail, 'administrator.deactivated', input.memberId, {
      administratorGrant: false,
      lifecycle: member.lifecycle,
    })
  })
}

export async function reactivateAdministrator(input: AdministratorInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireFormerAdministrator(tx, input.memberId)
    const [member] = await tx
      .update(members)
      .set({ lifecycle: 'active', updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
      .returning()
    await tx.insert(administrators).values({ memberId: input.memberId })
    await writeAudit(tx, input.actorEmail, 'administrator.reactivated', input.memberId, {
      administratorGrant: true,
      lifecycle: member.lifecycle,
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
    await tx.insert(administrators).values({ memberId: input.memberId })
    await writeAudit(tx, input.actorEmail, 'administrator.granted', input.memberId, {
      administratorGrant: true,
    })
  })
}

export async function revokeAdministrator(input: AdministratorInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireAdministrator(tx, input.memberId)
    await tx.delete(administrators).where(eq(administrators.memberId, input.memberId))
    await tx
      .update(members)
      .set({ lifecycle: 'deactivated', updatedAt: new Date() })
      .where(eq(members.id, input.memberId))
    await writeAudit(tx, input.actorEmail, 'administrator.revoked', input.memberId, {
      administratorGrant: false,
      lifecycle: 'deactivated',
    })
  })
}

async function requireFormerAdministrator(
  tx: Parameters<ReturnType<typeof getDb>['transaction']>[0] extends (
    tx: infer Transaction,
  ) => unknown
    ? Transaction
    : never,
  memberId: string,
) {
  const auditEntriesFound = await tx
    .select({ id: auditEntries.id })
    .from(auditEntries)
    .where(eq(auditEntries.targetId, memberId))
  if (auditEntriesFound.length === 0) throw new Error('Administrator not found')
}

async function requireAdministrator(
  tx: Parameters<ReturnType<typeof getDb>['transaction']>[0] extends (
    tx: infer Transaction,
  ) => unknown
    ? Transaction
    : never,
  memberId: string,
) {
  const grants = await tx
    .select()
    .from(administrators)
    .where(eq(administrators.memberId, memberId))
  if (grants.length === 0) throw new Error('Administrator not found')
}

async function writeAudit(
  tx: Parameters<ReturnType<typeof getDb>['transaction']>[0] extends (
    tx: infer Transaction,
  ) => unknown
    ? Transaction
    : never,
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
