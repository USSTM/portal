import { and, eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../../db/index.js'
import { auditEntries, clubs } from '../../db/schema.js'
import {
  memoryImageStore,
  setImageStoreForTesting,
  validateImage,
} from '../../storage/images.js'
import { archiveClub, createClub } from '../admin/clubs.js'
import { createMemberWithClubAccess } from '../admin/members.js'
import {
  listEditableClubProfiles,
  listPublicClubs,
  readPublicClubImage,
  removeClubImage,
  replaceClubImage,
  updateClubProfile,
} from './club-profiles.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip
const administrator = { email: 'admin@example.com', privileged: true }
const png = validateImage(
  Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]),
)

async function newClub(name = `Club ${crypto.randomUUID().slice(0, 8)}`) {
  return createClub({
    actorEmail: administrator.email,
    fullName: name,
    shortName: name,
  })
}

async function newMemberFor(clubId: string) {
  const member = await createMemberWithClubAccess({
    actorEmail: administrator.email,
    clubIds: [clubId],
    displayName: 'Club Member',
    email: `club-member-${crypto.randomUUID()}@example.com`,
  })
  return { email: member.email, privileged: false }
}

async function auditActions(clubId: string) {
  const entries = await getDb()
    .select({ action: auditEntries.action })
    .from(auditEntries)
    .where(
      and(
        eq(auditEntries.targetId, clubId),
        eq(auditEntries.targetType, 'club'),
      ),
    )
  return entries.map((entry) => entry.action)
}

describeWithDatabase('Club Profiles', () => {
  let store: ReturnType<typeof memoryImageStore>

  beforeEach(() => {
    store = memoryImageStore()
    setImageStoreForTesting(store)
  })

  afterEach(() => {
    setImageStoreForTesting(undefined)
  })

  it('lets a Club Access holder edit their Club Profile without an Audit Entry', async () => {
    const club = await newClub()
    const member = await newMemberFor(club.id)

    const updated = await updateClubProfile({
      actor: member,
      clubId: club.id,
      profile: {
        description: 'We build robots.',
        instagramHandle: '@robotics',
        type: 'student_group',
        websiteUrl: 'https://robotics.example.com',
      },
    })

    expect(updated).toMatchObject({
      description: 'We build robots.',
      instagramHandle: 'robotics',
      type: 'student_group',
      websiteUrl: 'https://robotics.example.com',
    })
    expect(await auditActions(club.id)).not.toContain('club.profile_updated')
    expect(
      (await listEditableClubProfiles(member)).map((entry) => entry.id),
    ).toEqual([club.id])
  })

  it('audits Club Profile edits by Administrators', async () => {
    const club = await newClub()

    await updateClubProfile({
      actor: administrator,
      clubId: club.id,
      profile: { description: 'Edited by an Administrator.' },
    })

    expect(await auditActions(club.id)).toContain('club.profile_updated')
  })

  it("denies Members without that Club's Club Access", async () => {
    const club = await newClub()
    const otherClub = await newClub()
    const outsider = await newMemberFor(otherClub.id)

    await expect(
      updateClubProfile({
        actor: outsider,
        clubId: club.id,
        profile: { description: 'Not mine.' },
      }),
    ).rejects.toThrow('Access denied')
    await expect(
      replaceClubImage({ actor: outsider, clubId: club.id, image: png }),
    ).rejects.toThrow('Access denied')
    expect(store.objects.size).toBe(0)
  })

  it('refuses to edit an Archived Club', async () => {
    const club = await newClub()
    await archiveClub({ actorEmail: administrator.email, clubId: club.id })

    await expect(
      updateClubProfile({
        actor: administrator,
        clubId: club.id,
        profile: { description: 'Too late.' },
      }),
    ).rejects.toThrow('Club not found')
  })

  it('replaces and removes the Club image, deleting the old object', async () => {
    const club = await newClub()
    const member = await newMemberFor(club.id)

    const firstId = await replaceClubImage({
      actor: member,
      clubId: club.id,
      image: png,
    })
    const secondId = await replaceClubImage({
      actor: member,
      clubId: club.id,
      image: png,
    })

    expect([...store.objects.keys()]).toEqual([`club-images/${secondId}`])
    expect(await readPublicClubImage(firstId)).toBeUndefined()
    expect(await readPublicClubImage(secondId)).toEqual(png)

    await removeClubImage({ actor: member, clubId: club.id })
    expect(store.objects.size).toBe(0)
    expect(await readPublicClubImage(secondId)).toBeUndefined()
  })

  it('publishes active Clubs with their profiles and hides Archived Clubs', async () => {
    const active = await newClub()
    const archived = await newClub()
    const imageId = await replaceClubImage({
      actor: administrator,
      clubId: active.id,
      image: png,
    })
    await updateClubProfile({
      actor: administrator,
      clubId: active.id,
      profile: { contactEmail: 'Club@Example.com', type: 'course_union' },
    })
    const archivedImageId = await replaceClubImage({
      actor: administrator,
      clubId: archived.id,
      image: png,
    })
    await archiveClub({ actorEmail: administrator.email, clubId: archived.id })

    const { clubs: published } = await listPublicClubs()
    const entry = published.find((club) => club.id === active.id)

    expect(published.some((club) => club.id === archived.id)).toBe(false)
    const usstm = await getDb()
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.protected, true))
    expect(
      published.some((club) => usstm.some(({ id }) => id === club.id)),
    ).toBe(false)
    expect(await readPublicClubImage(archivedImageId)).toBeUndefined()
    expect(entry).toEqual({
      contactEmail: 'club@example.com',
      description: null,
      fullName: active.fullName,
      id: active.id,
      imageUrl: `/api/v1/club-images/${imageId}`,
      instagramHandle: null,
      shortName: active.shortName,
      type: 'course_union',
      websiteUrl: null,
    })
    expect(Object.keys(entry ?? {})).not.toContain('lifecycle')
  })

  it('enforces the profile rules in the database too', async () => {
    const club = await newClub()

    await expect(
      getDb()
        .update(clubs)
        .set({ websiteUrl: 'http://example.com' })
        .where(eq(clubs.id, club.id)),
    ).rejects.toThrow()
  })
})
