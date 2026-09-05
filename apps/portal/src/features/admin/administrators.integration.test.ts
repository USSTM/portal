import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  deactivateAdministrator,
  grantAdministrator,
  grantClubAccessToAdministrator,
  reactivateAdministrator,
  revokeAdministrator,
  revokeClubAccessFromAdministrator,
} from './administrators.js'
import {
  createMemberWithClubAccess,
  grantClubAccess,
  reactivateMember,
  revokeClubAccess,
} from './members.js'
import { getDb } from '../../db/index.js'
import { USSTM_CLUB_ID } from '../../db/seed/usstm-club.js'
import { administrators, auditEntries, clubAccess, clubs, members } from '../../db/schema.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Superuser Administrator workflow', () => {
  it('creates an Administrator with automatic USSTM Club Access, demotes without deactivating, then deactivates with full cascade', async () => {
    const email = `admin-${crypto.randomUUID()}@example.com`
    const db = getDb()

    const administrator = await createMemberWithClubAccess({
      actorEmail: 'superuser@example.com',
      administrator: true,
      clubIds: [],
      displayName: 'Portal Administrator',
      email: ` ${email.toUpperCase()} `,
    })
    expect(administrator.email).toBe(email)

    const grantsAfterCreate = await db
      .select()
      .from(clubAccess)
      .where(eq(clubAccess.memberId, administrator.id))
    expect(grantsAfterCreate).toEqual([
      expect.objectContaining({ clubId: USSTM_CLUB_ID }),
    ])

    await revokeAdministrator({
      actorEmail: 'superuser@example.com',
      memberId: administrator.id,
    })

    const [afterRevoke] = await db
      .select()
      .from(members)
      .where(eq(members.id, administrator.id))
    const administratorGrantAfterRevoke = await db
      .select()
      .from(administrators)
      .where(eq(administrators.memberId, administrator.id))
    const clubGrantsAfterRevoke = await db
      .select()
      .from(clubAccess)
      .where(eq(clubAccess.memberId, administrator.id))
    expect(afterRevoke.lifecycle).toBe('active')
    expect(administratorGrantAfterRevoke).toHaveLength(0)
    expect(clubGrantsAfterRevoke).toEqual([
      expect.objectContaining({ clubId: USSTM_CLUB_ID }),
    ])

    await grantAdministrator({
      actorEmail: 'superuser@example.com',
      memberId: administrator.id,
    })
    const clubGrantsAfterRegrant = await db
      .select()
      .from(clubAccess)
      .where(eq(clubAccess.memberId, administrator.id))
    expect(clubGrantsAfterRegrant).toHaveLength(1)

    await deactivateAdministrator({
      actorEmail: 'superuser@example.com',
      memberId: administrator.id,
    })

    const [afterDeactivate] = await db
      .select()
      .from(members)
      .where(eq(members.id, administrator.id))
    const administratorGrantAfterDeactivate = await db
      .select()
      .from(administrators)
      .where(eq(administrators.memberId, administrator.id))
    const clubGrantsAfterDeactivate = await db
      .select()
      .from(clubAccess)
      .where(eq(clubAccess.memberId, administrator.id))
    const audit = await db
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, administrator.id))

    expect(afterDeactivate.lifecycle).toBe('deactivated')
    expect(administratorGrantAfterDeactivate).toHaveLength(0)
    expect(clubGrantsAfterDeactivate).toHaveLength(0)
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        'administrator.created',
        'administrator.revoked',
        'administrator.granted',
        'administrator.deactivated',
      ]),
    )
  })

  it('rejects creating a Member with an email that already exists', async () => {
    const email = `dup-${crypto.randomUUID()}@example.com`
    const [club] = await getDb().select().from(clubs).limit(1)

    await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [club.id],
      displayName: 'Original Member',
      email,
    })

    await expect(
      createMemberWithClubAccess({
        actorEmail: 'superuser@example.com',
        administrator: true,
        clubIds: [],
        displayName: 'Duplicate',
        email,
      }),
    ).rejects.toThrow(/already exists/)
  })

  it('reactivates only a Member who was never an Administrator through the ordinary path', async () => {
    const email = `former-admin-${crypto.randomUUID()}@example.com`
    const administrator = await createMemberWithClubAccess({
      actorEmail: 'superuser@example.com',
      administrator: true,
      clubIds: [],
      displayName: 'Former Administrator',
      email,
    })
    await deactivateAdministrator({
      actorEmail: 'superuser@example.com',
      memberId: administrator.id,
    })

    const [club] = await getDb().select().from(clubs).limit(1)
    await expect(
      reactivateMember({
        actorEmail: 'admin@example.com',
        clubIds: [club.id],
        memberId: administrator.id,
      }),
    ).rejects.toThrow('Access denied')

    await reactivateAdministrator({
      actorEmail: 'superuser@example.com',
      administrator: true,
      clubIds: [],
      memberId: administrator.id,
    })
    const [reactivated] = await getDb()
      .select()
      .from(members)
      .where(eq(members.id, administrator.id))
    expect(reactivated.lifecycle).toBe('active')
  })

  it('never revokes USSTM Club Access while the Administrator grant is held, but allows it once revoked', async () => {
    const administrator = await createMemberWithClubAccess({
      actorEmail: 'superuser@example.com',
      administrator: true,
      clubIds: [],
      displayName: 'Locked Chip Administrator',
      email: `locked-${crypto.randomUUID()}@example.com`,
    })

    await expect(
      revokeClubAccessFromAdministrator({
        actorEmail: 'superuser@example.com',
        clubId: USSTM_CLUB_ID,
        memberId: administrator.id,
      }),
    ).rejects.toThrow(/cannot be revoked/)

    await revokeAdministrator({
      actorEmail: 'superuser@example.com',
      memberId: administrator.id,
    })
    await revokeClubAccess({
      actorEmail: 'admin@example.com',
      clubId: USSTM_CLUB_ID,
      memberId: administrator.id,
    })
    const remainingGrants = await getDb()
      .select()
      .from(clubAccess)
      .where(eq(clubAccess.memberId, administrator.id))
    expect(remainingGrants).toHaveLength(0)
  })

  it('lets an ordinary Administrator grant USSTM Club Access to a non-administrator Member', async () => {
    const [otherClub] = await getDb().select().from(clubs).where(eq(clubs.protected, false)).limit(1)
    const member = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [otherClub.id],
      displayName: 'USSTM Volunteer',
      email: `volunteer-${crypto.randomUUID()}@example.com`,
    })

    await grantClubAccess({
      actorEmail: 'admin@example.com',
      clubId: USSTM_CLUB_ID,
      memberId: member.id,
    })

    const grants = await getDb()
      .select()
      .from(clubAccess)
      .where(
        and(eq(clubAccess.memberId, member.id), eq(clubAccess.clubId, USSTM_CLUB_ID)),
      )
    expect(grants).toHaveLength(1)
  })

  it('rejects granting Club Access to an Administrator record through the Superuser-only path when the Club is archived', async () => {
    const administrator = await createMemberWithClubAccess({
      actorEmail: 'superuser@example.com',
      administrator: true,
      clubIds: [],
      displayName: 'Archived Club Test Administrator',
      email: `archived-${crypto.randomUUID()}@example.com`,
    })

    await expect(
      grantClubAccessToAdministrator({
        actorEmail: 'superuser@example.com',
        clubId: crypto.randomUUID(),
        memberId: administrator.id,
      }),
    ).rejects.toThrow(/active Club/)
  })
})
