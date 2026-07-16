import { and, count, desc, ilike } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import { auditEntries } from '../../db/schema.js'

export type AuditHistoryInput = {
  action?: string
  actorEmail?: string
  page: number
  pageSize: number
}

export async function browseAuditHistory(input: AuditHistoryInput) {
  if (
    !Number.isInteger(input.page) ||
    input.page < 1 ||
    !Number.isInteger(input.pageSize) ||
    input.pageSize < 1 ||
    input.pageSize > 100
  ) {
    throw new Error('Invalid Audit History page')
  }
  const filters = [
    input.actorEmail
      ? ilike(auditEntries.actorEmail, `%${input.actorEmail.trim()}%`)
      : undefined,
    input.action ? ilike(auditEntries.action, `%${input.action.trim()}%`) : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => filter !== undefined)
  const where = filters.length > 0 ? and(...filters) : undefined
  const db = getDb()
  const [{ total }] = await db.select({ total: count() }).from(auditEntries).where(where)
  const entries = await db
    .select()
    .from(auditEntries)
    .where(where)
    .orderBy(desc(auditEntries.createdAt), desc(auditEntries.id))
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize)

  return {
    entries: entries.map((entry) => ({
      ...entry,
      changedValues: JSON.stringify(entry.changedValues),
    })),
    total,
  }
}

export function requireAuditHistoryAuthority(identity: PortalIdentity) {
  if (identity.kind === 'superuser' || identity.kind === 'administrator') {
    return identity.email
  }
  throw new Error('Access denied')
}
