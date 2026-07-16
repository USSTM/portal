import { and, count, desc, eq, ilike, or } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import { auditEntries, clubAccess, clubs } from '../../db/schema.js'

type ClubInput = {
  actorEmail: string
  clubId: string
}

export async function createClub(input: {
  actorEmail: string
  contactEmail?: string
  fullName: string
  shortName: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [club] = await tx
      .insert(clubs)
      .values({
        contactEmail: normalizeOptionalEmail(input.contactEmail),
        fullName: input.fullName.trim(),
        shortName: input.shortName.trim(),
      })
      .returning()
    await writeAudit(tx, input.actorEmail, 'club.created', club.id, {
      contactEmail: club.contactEmail,
      fullName: club.fullName,
      lifecycle: club.lifecycle,
      shortName: club.shortName,
    })
    return club
  })
}

export async function editClub(
  input: ClubInput & { contactEmail?: string; fullName: string; shortName: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [club] = await tx
      .update(clubs)
      .set({
        contactEmail: normalizeOptionalEmail(input.contactEmail),
        fullName: input.fullName.trim(),
        shortName: input.shortName.trim(),
        updatedAt: new Date(),
      })
      .where(eq(clubs.id, input.clubId))
      .returning()
    await writeAudit(tx, input.actorEmail, 'club.updated', club.id, {
      contactEmail: club.contactEmail,
      fullName: club.fullName,
      shortName: club.shortName,
    })
    return club
  })
}

export async function archiveClub(input: ClubInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [club] = await tx
      .update(clubs)
      .set({ lifecycle: 'archived', updatedAt: new Date() })
      .where(eq(clubs.id, input.clubId))
      .returning()
    await tx.delete(clubAccess).where(eq(clubAccess.clubId, input.clubId))
    await writeAudit(tx, input.actorEmail, 'club.archived', club.id, {
      lifecycle: club.lifecycle,
      revokedClubAccess: true,
    })
  })
}

export async function reactivateClub(input: ClubInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [club] = await tx
      .update(clubs)
      .set({ lifecycle: 'active', updatedAt: new Date() })
      .where(eq(clubs.id, input.clubId))
      .returning()
    await writeAudit(tx, input.actorEmail, 'club.reactivated', club.id, {
      lifecycle: club.lifecycle,
      restoredClubAccess: false,
    })
  })
}

export async function browseClubs(input: {
  lifecycle?: 'active' | 'archived'
  search?: string
}) {
  const filters = [
    input.lifecycle ? eq(clubs.lifecycle, input.lifecycle) : undefined,
    input.search
      ? or(
          ilike(clubs.shortName, `%${input.search.trim()}%`),
          ilike(clubs.fullName, `%${input.search.trim()}%`),
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => filter !== undefined)
  const where = filters.length > 0 ? and(...filters) : undefined
  const db = getDb()
  const [{ total }] = await db.select({ total: count() }).from(clubs).where(where)
  const entries = await db
    .select()
    .from(clubs)
    .where(where)
    .orderBy(desc(clubs.updatedAt), desc(clubs.id))
  return { entries, total }
}

export function requireClubAdministrationAuthority(identity: PortalIdentity) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Access denied')
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
    actorEmail: actorEmail.trim().toLowerCase(),
    changedValues,
    targetId,
    targetType: 'club',
  })
}

function normalizeOptionalEmail(email: string | undefined) {
  const normalized = email?.trim().toLowerCase()
  return normalized || null
}
