import { and, asc, eq } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import { auditEntries, clubAccess, clubs, members } from '../../db/schema.js'
import { getImageStore, newImageId } from '../../storage/images.js'
import type { StoredImage } from '../../storage/images.js'
import { clubImagePath } from './club-image-path.js'

export type ClubType = 'student_group' | 'course_union'

export type ClubProfileInput = {
  contactEmail?: string
  description?: string
  instagramHandle?: string
  type?: ClubType
  websiteUrl?: string
}

/**
 * Who is editing a Club Profile. Administrators and the Superuser may edit any
 * active Club; other Members need that Club's Club Access.
 */
export type ClubProfileActor = { email: string; privileged: boolean }

export function requireClubProfileActor(
  identity: PortalIdentity,
): ClubProfileActor {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return { email: identity.email, privileged: true }
  }
  if (identity.kind === 'member') {
    return { email: identity.email, privileged: false }
  }
  throw new Error('Access denied')
}

export async function updateClubProfile(input: {
  actor: ClubProfileActor
  clubId: string
  profile: ClubProfileInput
}) {
  const profile = normalizeClubProfile(input.profile)
  const db = getDb()
  return db.transaction(async (tx) => {
    await requireClubProfileAuthority(tx, input.actor, input.clubId)
    const [club] = await tx
      .update(clubs)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(clubs.id, input.clubId))
      .returning()
    // ADR-0010 audits Administrator and Superuser changes, not changes made
    // through Club Access, as it does for Events.
    if (input.actor.privileged) {
      await writeAudit(tx, input.actor.email, 'club.profile_updated', club.id, {
        ...profile,
      })
    }
    return club
  })
}

export async function replaceClubImage(input: {
  actor: ClubProfileActor
  clubId: string
  image: StoredImage
}) {
  const store = getImageStore()
  const imageId = newImageId(input.image.contentType)
  await store.put(clubImageKey(imageId), input.image)
  let previousImageId: string | null
  try {
    previousImageId = await setClubImage(input.actor, input.clubId, imageId)
  } catch (error) {
    await store.delete(clubImageKey(imageId)).catch(() => undefined)
    throw error
  }
  await deleteStoredImage(previousImageId)
  return imageId
}

export async function removeClubImage(input: {
  actor: ClubProfileActor
  clubId: string
}) {
  const previousImageId = await setClubImage(input.actor, input.clubId, null)
  await deleteStoredImage(previousImageId)
}

export async function listEditableClubProfiles(actor: ClubProfileActor) {
  const columns = {
    contactEmail: clubs.contactEmail,
    description: clubs.description,
    fullName: clubs.fullName,
    id: clubs.id,
    imageId: clubs.imageId,
    instagramHandle: clubs.instagramHandle,
    shortName: clubs.shortName,
    type: clubs.type,
    websiteUrl: clubs.websiteUrl,
  }
  const db = getDb()
  if (actor.privileged) {
    return db
      .select(columns)
      .from(clubs)
      .where(eq(clubs.lifecycle, 'active'))
      .orderBy(asc(clubs.fullName))
  }
  return db
    .select(columns)
    .from(clubAccess)
    .innerJoin(members, eq(members.id, clubAccess.memberId))
    .innerJoin(clubs, eq(clubs.id, clubAccess.clubId))
    .where(
      and(
        eq(members.email, actor.email),
        eq(members.lifecycle, 'active'),
        eq(clubs.lifecycle, 'active'),
      ),
    )
    .orderBy(asc(clubs.fullName))
}

/**
 * Active Clubs and their Club Profiles for `GET /api/v1/clubs`. The USSTM Club
 * represents USSTM itself rather than an associated organization, so it is not
 * listed.
 */
export async function listPublicClubs() {
  const entries = await getDb()
    .select({
      contactEmail: clubs.contactEmail,
      description: clubs.description,
      fullName: clubs.fullName,
      id: clubs.id,
      imageId: clubs.imageId,
      instagramHandle: clubs.instagramHandle,
      shortName: clubs.shortName,
      type: clubs.type,
      websiteUrl: clubs.websiteUrl,
    })
    .from(clubs)
    .where(and(eq(clubs.lifecycle, 'active'), eq(clubs.protected, false)))
    .orderBy(asc(clubs.fullName), asc(clubs.id))
  return {
    clubs: entries.map(({ imageId, ...club }) => ({
      ...club,
      imageUrl: imageId ? clubImagePath(imageId) : null,
    })),
  }
}

/** Serves an image only while an active Club uses it. */
export async function readPublicClubImage(imageId: string) {
  const found = await getDb()
    .select({ id: clubs.id })
    .from(clubs)
    .where(and(eq(clubs.imageId, imageId), eq(clubs.lifecycle, 'active')))
  if (found.length === 0) return undefined
  return getImageStore().get(clubImageKey(imageId))
}

export function normalizeClubProfile(profile: ClubProfileInput) {
  const optional = (value: string | undefined) => value?.trim() || null
  const instagramHandle = optional(profile.instagramHandle)?.replace(/^@/, '')
  return {
    contactEmail: optional(profile.contactEmail)?.toLowerCase() ?? null,
    description: optional(profile.description),
    instagramHandle: instagramHandle || null,
    type: profile.type ?? null,
    websiteUrl: optional(profile.websiteUrl),
  }
}

async function setClubImage(
  actor: ClubProfileActor,
  clubId: string,
  imageId: string | null,
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const club = await requireClubProfileAuthority(tx, actor, clubId)
    await tx
      .update(clubs)
      .set({ imageId, updatedAt: new Date() })
      .where(eq(clubs.id, clubId))
    if (actor.privileged) {
      await writeAudit(
        tx,
        actor.email,
        imageId ? 'club.image_replaced' : 'club.image_removed',
        clubId,
        { imageId },
      )
    }
    return club.imageId
  })
}

async function deleteStoredImage(imageId: string | null) {
  if (!imageId) return
  try {
    await getImageStore().delete(clubImageKey(imageId))
  } catch (error) {
    // The Club no longer references it, so a leftover object is never served.
    console.error('Unable to delete replaced Club image', { error, imageId })
  }
}

async function requireClubProfileAuthority(
  tx: Transaction,
  actor: ClubProfileActor,
  clubId: string,
) {
  const found = await tx
    .select({ imageId: clubs.imageId, lifecycle: clubs.lifecycle })
    .from(clubs)
    .where(eq(clubs.id, clubId))
  const club = found.at(0)
  if (!club || club.lifecycle !== 'active') throw new Error('Club not found')
  if (actor.privileged) return club

  const access = await tx
    .select({ clubId: clubAccess.clubId })
    .from(clubAccess)
    .innerJoin(members, eq(members.id, clubAccess.memberId))
    .where(
      and(
        eq(clubAccess.clubId, clubId),
        eq(members.email, actor.email),
        eq(members.lifecycle, 'active'),
      ),
    )
  if (access.length === 0) throw new Error('Access denied')
  return club
}

function clubImageKey(imageId: string) {
  return `club-images/${imageId}`
}

type Transaction = Parameters<
  ReturnType<typeof getDb>['transaction']
>[0] extends (tx: infer InferredTransaction) => unknown
  ? InferredTransaction
  : never

async function writeAudit(
  tx: Transaction,
  actorEmail: string,
  action: string,
  targetId: string,
  changedValues: Record<string, unknown>,
) {
  await tx.insert(auditEntries).values({
    action,
    actorEmail: actorEmail.trim().toLowerCase(),
    changedValues,
    targetId,
    targetType: 'club',
  })
}
