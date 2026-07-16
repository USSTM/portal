import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { auditEntries, clubAccess, members } from '../../db/schema.js'
import {
  createMemberWithClubAccess,
  grantClubAccess,
  revokeClubAccess,
} from './members.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Member Club Access lifecycle', () => {
  it('provisions multiple grants and deactivates after the final revocation', async () => {
    const db = getDb()
    const clubs = await db.query.clubs.findMany({ limit: 2 })
    if (clubs.length < 2) throw new Error('Integration test requires two active Clubs')

    const member = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [clubs[0].id],
      displayName: 'Club Access Member',
      email: `member-${crypto.randomUUID()}@example.com`,
    })
    await grantClubAccess({
      actorEmail: 'admin@example.com',
      clubId: clubs[1].id,
      memberId: member.id,
    })
    await revokeClubAccess({
      actorEmail: 'admin@example.com',
      clubId: clubs[0].id,
      memberId: member.id,
    })
    await revokeClubAccess({
      actorEmail: 'admin@example.com',
      clubId: clubs[1].id,
      memberId: member.id,
    })

    const [storedMember] = await db.select().from(members).where(eq(members.id, member.id))
    const grants = await db
      .select()
      .from(clubAccess)
      .where(eq(clubAccess.memberId, member.id))
    const audit = await db
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, member.id))

    expect(storedMember.lifecycle).toBe('deactivated')
    expect(grants).toHaveLength(0)
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(['member.created', 'club_access.granted', 'club_access.revoked']),
    )
  })
})
