import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { auditEntries, members } from '../../db/schema.js'
import {
  memoryImageStore,
  setImageStoreForTesting,
  validateImage,
} from '../../storage/images.js'
import {
  createMemberWithClubAccess,
  deactivateMember,
} from '../admin/members.js'
import {
  getOwnMemberProfile,
  removeOwnPhoto,
  replaceOwnPhoto,
  updateOwnBio,
} from './member-profiles.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip
const png = validateImage(
  Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]),
)

async function newMember(administrator = false) {
  const db = getDb()
  const club = await db.query.clubs.findFirst()
  if (!club) throw new Error('Integration test requires an active Club')
  return createMemberWithClubAccess({
    actorEmail: 'superuser@example.com',
    administrator,
    clubIds: administrator ? [] : [club.id],
    displayName: 'Profile Member',
    email: `profile-${crypto.randomUUID()}@example.com`,
  })
}

describeWithDatabase('Member Profiles', () => {
  let store: ReturnType<typeof memoryImageStore>

  beforeEach(() => {
    store = memoryImageStore()
    setImageStoreForTesting(store)
  })

  afterEach(() => {
    setImageStoreForTesting(undefined)
  })

  it('lets a Member manage their own photo and bio without an Audit Entry', async () => {
    const member = await newMember()

    await updateOwnBio(member.email, '  I study chemistry.  ')
    const firstId = await replaceOwnPhoto(member.email, png)
    const secondId = await replaceOwnPhoto(member.email, png)

    expect([...store.objects.keys()]).toEqual([`member-photos/${secondId}`])
    expect(firstId).not.toBe(secondId)
    expect(await getOwnMemberProfile(member.email)).toEqual({
      bio: 'I study chemistry.',
      photoDataUrl: `data:image/png;base64,${Buffer.from(png.body).toString('base64')}`,
    })

    await removeOwnPhoto(member.email)
    await updateOwnBio(member.email, '')
    expect(store.objects.size).toBe(0)
    expect(await getOwnMemberProfile(member.email)).toEqual({
      bio: null,
      photoDataUrl: null,
    })
    const audit = await getDb()
      .select()
      .from(auditEntries)
      .where(eq(auditEntries.targetId, member.id))
    expect(audit.map((entry) => entry.action)).toEqual(['member.created'])
  })

  it("changes only the signed-in Member's profile, Administrators included", async () => {
    const administrator = await newMember(true)
    const member = await newMember()
    await updateOwnBio(member.email, 'Mine.')

    await updateOwnBio(administrator.email, 'Administrator bio.')

    const [stored] = await getDb()
      .select({ bio: members.bio })
      .from(members)
      .where(eq(members.id, member.id))
    expect(stored.bio).toBe('Mine.')
  })

  it('denies deactivated Members and keeps their profile', async () => {
    const member = await newMember()
    await updateOwnBio(member.email, 'Kept privately.')
    await deactivateMember({
      actorEmail: 'admin@example.com',
      memberId: member.id,
    })

    await expect(updateOwnBio(member.email, 'Changed.')).rejects.toThrow(
      'Access denied',
    )
    await expect(replaceOwnPhoto(member.email, png)).rejects.toThrow(
      'Access denied',
    )
    const [stored] = await getDb()
      .select({ bio: members.bio })
      .from(members)
      .where(eq(members.id, member.id))
    expect(stored.bio).toBe('Kept privately.')
    expect(store.objects.size).toBe(0)
  })

  it('enforces the bio limit in the database too', async () => {
    const member = await newMember()

    await expect(
      getDb()
        .update(members)
        .set({ bio: 'x'.repeat(501) })
        .where(eq(members.id, member.id)),
    ).rejects.toThrow()
  })
})
