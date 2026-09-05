import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { boardMembers, members } from '../../db/schema.js'
import type { PortalIdentity } from '../../auth/access.js'
import {
  boardMemberIdForIdentity,
  requireBoardMember,
} from './calendar-actions.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Board Member authority resolution', () => {
  it('resolves Board Member authority regardless of identity kind', async () => {
    const db = getDb()
    const [member] = await db
      .insert(members)
      .values({
        displayName: 'Overlap Board Member',
        email: `overlap-${crypto.randomUUID()}@example.com`,
      })
      .returning()
    await db
      .insert(boardMembers)
      .values({ boardPosition: 'Treasurer', memberId: member.id })

    // An Administrator (or the Superuser) may also hold Board Member
    // authority and must still be able to manage their own Booking.
    const asMember: PortalIdentity = { email: member.email, kind: 'member' }
    const asAdministrator: PortalIdentity = {
      email: member.email,
      kind: 'administrator',
    }
    const asSuperuser: PortalIdentity = {
      email: member.email,
      kind: 'superuser',
    }

    await expect(boardMemberIdForIdentity(asMember)).resolves.toBe(member.id)
    await expect(boardMemberIdForIdentity(asAdministrator)).resolves.toBe(
      member.id,
    )
    await expect(boardMemberIdForIdentity(asSuperuser)).resolves.toBe(
      member.id,
    )

    await expect(requireBoardMember(asMember)).resolves.toBe(member.email)
    await expect(requireBoardMember(asAdministrator)).resolves.toBe(
      member.email,
    )
    await expect(requireBoardMember(asSuperuser)).resolves.toBe(member.email)
  })

  it('denies identities without Board Member authority', async () => {
    const nonMemberEmail = `not-a-board-member-${crypto.randomUUID()}@example.com`

    const cases: Array<PortalIdentity> = [
      { kind: 'anonymous' },
      { kind: 'denied' },
      { email: nonMemberEmail, kind: 'member' },
      { email: nonMemberEmail, kind: 'administrator' },
    ]

    for (const identity of cases) {
      await expect(boardMemberIdForIdentity(identity)).resolves.toBeUndefined()
      await expect(requireBoardMember(identity)).rejects.toThrow(
        'Board Member authority is required',
      )
    }
  })
})
