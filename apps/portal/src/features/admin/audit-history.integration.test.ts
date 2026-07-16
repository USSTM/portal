import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { auditEntries } from '../../db/schema.js'
import { browseAuditHistory } from './audit-history.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Audit History', () => {
  it('filters by actor and action, orders newest first, and paginates', async () => {
    const db = getDb()
    const marker = crypto.randomUUID()
    const actorEmail = `auditor-${marker}@example.com`
    const targetId = crypto.randomUUID()

    await db.insert(auditEntries).values([
      {
        action: `administrator.created.${marker}`,
        actorEmail,
        changedValues: { index: 1 },
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        targetId,
        targetType: 'member',
      },
      {
        action: `administrator.updated.${marker}`,
        actorEmail,
        changedValues: { index: 2 },
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        targetId,
        targetType: 'member',
      },
      {
        action: `resource.updated.${marker}`,
        actorEmail: `other-${marker}@example.com`,
        changedValues: { index: 3 },
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        targetId,
        targetType: 'resource',
      },
    ])

    const firstPage = await browseAuditHistory({
      action: 'administrator',
      actorEmail,
      page: 1,
      pageSize: 1,
    })
    const secondPage = await browseAuditHistory({
      action: 'administrator',
      actorEmail,
      page: 2,
      pageSize: 1,
    })

    expect(firstPage.total).toBe(2)
    expect(firstPage.entries[0]).toMatchObject({
      action: `administrator.updated.${marker}`,
      changedValues: JSON.stringify({ index: 2 }),
    })
    expect(secondPage.entries[0]).toMatchObject({
      action: `administrator.created.${marker}`,
      changedValues: JSON.stringify({ index: 1 }),
    })
  })
})
