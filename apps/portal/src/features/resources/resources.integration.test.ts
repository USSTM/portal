import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { auditEntries } from '../../db/schema.js'
import {
  browseResources,
  createResource,
  editResource,
  setResourceActive,
} from './resources'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Resources', () => {
  it('orders active Resources, hides inactive entries, and audits mutations', async () => {
    const suffix = crypto.randomUUID()
    const actorEmail = `admin-${suffix}@example.com`
    const first = await createResource({
      actorEmail,
      category: 'finance',
      description: 'The first Resource in its category.',
      displayOrder: 2,
      title: `Second ${suffix}`,
      url: 'https://example.com/second',
    })
    const second = await createResource({
      actorEmail,
      category: 'finance',
      description: 'The second Resource in its category.',
      displayOrder: 1,
      title: `First ${suffix}`,
      url: 'https://example.com/first',
    })
    await editResource({
      actorEmail,
      category: 'operations',
      description: 'An updated plain-text Resource description.',
      displayOrder: 3,
      resourceId: first.id,
      title: `Updated ${suffix}`,
      url: 'https://example.com/updated',
    })
    await setResourceActive({ active: false, actorEmail, resourceId: first.id })

    const active = await browseResources({ active: true })
    expect(active.map((resource) => resource.id)).toContain(second.id)
    expect(active.map((resource) => resource.id)).not.toContain(first.id)
    const all = await browseResources()
    expect(all.find((resource) => resource.id === first.id)).toMatchObject({
      active: false,
      category: 'operations',
      displayOrder: 3,
    })
    const audit = await getDb()
      .select()
      .from(auditEntries)
      .where(
        and(
          eq(auditEntries.targetId, first.id),
          eq(auditEntries.targetType, 'resource'),
        ),
      )
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        'resource.created',
        'resource.updated',
        'resource.deactivated',
      ]),
    )
  })
})
