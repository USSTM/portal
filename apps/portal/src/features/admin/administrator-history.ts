import { and, eq, like } from 'drizzle-orm'

import type { getDb } from '../../db/index.js'
import { auditEntries } from '../../db/schema.js'

type Transaction = Parameters<
  ReturnType<typeof getDb>['transaction']
>[0] extends (tx: infer InferredTransaction) => unknown
  ? InferredTransaction
  : never

export async function wasEverAdministrator(
  tx: Transaction,
  memberId: string,
): Promise<boolean> {
  const found = await tx
    .select({ id: auditEntries.id })
    .from(auditEntries)
    .where(
      and(eq(auditEntries.targetId, memberId), like(auditEntries.action, 'administrator.%')),
    )
  return found.length > 0
}
