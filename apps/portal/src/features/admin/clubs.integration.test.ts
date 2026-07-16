import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { auditEntries, clubAccess, clubs, members } from '../../db/schema.js'
import { archiveClub, createClub, reactivateClub } from './clubs.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Club lifecycle', () => {
  it('archives without deletion, then reactivates with audit entries', async () => {
    const shortName = `club-${crypto.randomUUID().slice(0, 8)}`
    const club = await createClub({
      actorEmail: 'admin@example.com',
      contactEmail: 'club@example.com',
      fullName: 'Test Table Tennis Club',
      shortName,
    })
    const [member] = await getDb()
      .insert(members)
      .values({
        displayName: 'Club Access Holder',
        email: `member-${crypto.randomUUID()}@example.com`,
      })
      .returning()
    await getDb().insert(clubAccess).values({ clubId: club.id, memberId: member.id })

    await archiveClub({ actorEmail: 'admin@example.com', clubId: club.id })
    await reactivateClub({ actorEmail: 'admin@example.com', clubId: club.id })

    const db = getDb()
    const [storedClub] = await db.select().from(clubs).where(eq(clubs.id, club.id))
    const audit = await db
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, club.id))
    const remainingAccess = await db
      .select()
      .from(clubAccess)
      .where(eq(clubAccess.clubId, club.id))

    expect(storedClub).toMatchObject({ lifecycle: 'active', shortName })
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(['club.created', 'club.archived', 'club.reactivated']),
    )
    expect(remainingAccess).toHaveLength(0)
  })
})
