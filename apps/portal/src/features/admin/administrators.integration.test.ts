import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  createAdministrator,
  deactivateAdministrator,
  reactivateAdministrator,
} from './administrators.js'
import { getDb } from '../../db/index.js'
import { administrators, auditEntries, members } from '../../db/schema.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Superuser Administrator workflow', () => {
  it('creates, deactivates, and reactivates an Administrator with audit history', async () => {
    const email = `admin-${crypto.randomUUID()}@example.com`
    const db = getDb()

    const administrator = await createAdministrator({
      actorEmail: 'superuser@example.com',
      displayName: 'Portal Administrator',
      email: ` ${email.toUpperCase()} `,
    })
    expect(administrator.email).toBe(email)

    await expect(
      createAdministrator({
        actorEmail: 'superuser@example.com',
        displayName: 'Duplicate',
        email,
      }),
    ).rejects.toThrow()

    await deactivateAdministrator({
      actorEmail: 'superuser@example.com',
      memberId: administrator.id,
    })
    await reactivateAdministrator({
      actorEmail: 'superuser@example.com',
      memberId: administrator.id,
    })

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, administrator.id))
    const grants = await db
      .select()
      .from(administrators)
      .where(eq(administrators.memberId, administrator.id))
    const audit = await db
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, administrator.id))

    expect(member).toMatchObject({ email, lifecycle: 'active' })
    expect(grants).toHaveLength(1)
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        'administrator.created',
        'administrator.deactivated',
        'administrator.reactivated',
      ]),
    )
  })
})
