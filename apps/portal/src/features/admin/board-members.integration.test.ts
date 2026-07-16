import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { auditEntries, boardMembers, members } from '../../db/schema.js'
import {
  createMemberWithBoardAuthority,
  revokeBoardAuthority,
} from './board-members.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Board Member lifecycle', () => {
  it('provisions a Board-only Member and deactivates them after revocation', async () => {
    const member = await createMemberWithBoardAuthority({
      actorEmail: 'admin@example.com',
      boardPosition: 'Treasurer',
      displayName: 'Board Member',
      email: `board-${crypto.randomUUID()}@example.com`,
    })

    await revokeBoardAuthority({ actorEmail: 'admin@example.com', memberId: member.id })

    const db = getDb()
    const [storedMember] = await db.select().from(members).where(eq(members.id, member.id))
    const grants = await db
      .select()
      .from(boardMembers)
      .where(eq(boardMembers.memberId, member.id))
    const audit = await db
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, member.id))

    expect(storedMember.lifecycle).toBe('deactivated')
    expect(grants).toHaveLength(0)
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(['board_member.created', 'board_member.revoked']),
    )
  })
})
