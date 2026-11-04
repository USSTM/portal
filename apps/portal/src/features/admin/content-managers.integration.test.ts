import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { auditEntries, contentManagers, members } from '../../db/schema.js'
import {
  grantContentManager,
  hasContentManagerAuthority,
  hasContentManagerAuthorityForEmail,
  revokeContentManager,
} from './content-managers.js'
import {
  createMemberWithClubAccess,
  deactivateMember,
  reactivateMember,
  revokeClubAccess,
} from './members.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase('Content Manager lifecycle', () => {
  it('grants and revokes Content Manager with Audit Entries', async () => {
    const db = getDb()
    const club = await db.query.clubs.findFirst()
    if (!club) throw new Error('Integration test requires an active Club')
    const member = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [club.id],
      displayName: 'Editor',
      email: `editor-${crypto.randomUUID()}@example.com`,
    })
    const identity = { email: member.email, kind: 'member' as const }

    await expect(hasContentManagerAuthority(identity)).resolves.toBe(false)
    await grantContentManager({
      actorEmail: 'admin@example.com',
      memberId: member.id,
    })
    await expect(hasContentManagerAuthority(identity)).resolves.toBe(true)
    await revokeContentManager({
      actorEmail: 'admin@example.com',
      memberId: member.id,
    })
    await expect(hasContentManagerAuthority(identity)).resolves.toBe(false)

    const [storedMember] = await db
      .select()
      .from(members)
      .where(eq(members.id, member.id))
    const audit = await db
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, member.id))

    expect(storedMember.lifecycle).toBe('active')
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        'content_manager.granted',
        'content_manager.revoked',
      ]),
    )
  })

  it('keeps a Content Manager-only Member active and deactivates them after the final revocation', async () => {
    const db = getDb()
    const club = await db.query.clubs.findFirst()
    if (!club) throw new Error('Integration test requires an active Club')
    const member = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [club.id],
      contentManager: true,
      displayName: 'Communications',
      email: `comms-${crypto.randomUUID()}@example.com`,
    })

    await revokeClubAccess({
      actorEmail: 'admin@example.com',
      clubId: club.id,
      memberId: member.id,
    })
    const [afterClubRevoke] = await db
      .select()
      .from(members)
      .where(eq(members.id, member.id))
    expect(afterClubRevoke.lifecycle).toBe('active')

    await revokeContentManager({
      actorEmail: 'admin@example.com',
      memberId: member.id,
    })
    const [afterFinalRevoke] = await db
      .select()
      .from(members)
      .where(eq(members.id, member.id))
    expect(afterFinalRevoke.lifecycle).toBe('deactivated')
  })

  it('provisions and reactivates a Member with Content Manager as the only grant', async () => {
    const db = getDb()
    const member = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [],
      contentManager: true,
      displayName: 'Content Only',
      email: `content-only-${crypto.randomUUID()}@example.com`,
    })
    expect(member.lifecycle).toBe('active')

    await deactivateMember({
      actorEmail: 'admin@example.com',
      memberId: member.id,
    })
    expect(
      await db
        .select()
        .from(contentManagers)
        .where(eq(contentManagers.memberId, member.id)),
    ).toHaveLength(0)

    await reactivateMember({
      actorEmail: 'admin@example.com',
      clubIds: [],
      contentManager: true,
      memberId: member.id,
    })
    await expect(
      hasContentManagerAuthority({ email: member.email, kind: 'member' }),
    ).resolves.toBe(true)
  })

  it('denies authority to Members without the grant and to deactivated Content Managers', async () => {
    const db = getDb()
    const club = await db.query.clubs.findFirst()
    if (!club) throw new Error('Integration test requires an active Club')
    const member = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [club.id],
      contentManager: true,
      displayName: 'Former Editor',
      email: `former-editor-${crypto.randomUUID()}@example.com`,
    })
    const other = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [club.id],
      displayName: 'Club Member',
      email: `club-member-${crypto.randomUUID()}@example.com`,
    })
    await db
      .update(members)
      .set({ lifecycle: 'deactivated' })
      .where(eq(members.id, member.id))

    await expect(
      hasContentManagerAuthority({ email: member.email, kind: 'member' }),
    ).resolves.toBe(false)
    await expect(
      hasContentManagerAuthority({ email: other.email, kind: 'member' }),
    ).resolves.toBe(false)
  })

  it('resolves authority for a Website session email', async () => {
    const db = getDb()
    const club = await db.query.clubs.findFirst()
    if (!club) throw new Error('Integration test requires an active Club')
    const editor = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [],
      contentManager: true,
      displayName: 'Website Editor',
      email: `website-editor-${crypto.randomUUID()}@example.com`,
    })
    const administrator = await createMemberWithClubAccess({
      actorEmail: 'superuser@example.com',
      administrator: true,
      clubIds: [],
      displayName: 'Website Administrator',
      email: `website-administrator-${crypto.randomUUID()}@example.com`,
    })
    const clubMember = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [club.id],
      displayName: 'Club Member',
      email: `website-member-${crypto.randomUUID()}@example.com`,
    })
    const superuserEmail = 'superuser@example.com'

    await expect(
      hasContentManagerAuthorityForEmail(
        ` ${editor.email.toUpperCase()} `,
        superuserEmail,
      ),
    ).resolves.toBe(true)
    await expect(
      hasContentManagerAuthorityForEmail(administrator.email, superuserEmail),
    ).resolves.toBe(true)
    await expect(
      hasContentManagerAuthorityForEmail(superuserEmail, superuserEmail),
    ).resolves.toBe(true)
    await expect(
      hasContentManagerAuthorityForEmail(clubMember.email, superuserEmail),
    ).resolves.toBe(false)
    await expect(
      hasContentManagerAuthorityForEmail(
        `unknown-${crypto.randomUUID()}@example.com`,
        superuserEmail,
      ),
    ).resolves.toBe(false)
  })

  it('refuses to grant Content Manager to an Administrator', async () => {
    const administrator = await createMemberWithClubAccess({
      actorEmail: 'superuser@example.com',
      administrator: true,
      clubIds: [],
      displayName: 'Administrator',
      email: `administrator-${crypto.randomUUID()}@example.com`,
    })

    await expect(
      grantContentManager({
        actorEmail: 'admin@example.com',
        memberId: administrator.id,
      }),
    ).rejects.toThrow('Member not available for administration')
  })
})
