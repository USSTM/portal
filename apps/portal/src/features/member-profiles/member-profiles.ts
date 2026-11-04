import { and, eq } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'
import type { StoredImage } from '../../storage/images.js'

import { getDb } from '../../db/index.js'
import { members } from '../../db/schema.js'
import { getImageStore, newImageId } from '../../storage/images.js'

// A Member Profile (photo and bio) is edited only by the Member themselves:
// every function here acts on the signed-in email, so there is no way to name
// another Member, and Administrators get no override. Self-service edits are
// not privileged administrative mutations, so they are not audited (ADR-0010).
// The profile becomes public only while the Member is a Board Member (ticket
// 10); deactivation revokes Board Member authority, which keeps it private.

export const MAX_BIO_LENGTH = 500

export function requireMemberProfileOwner(identity: PortalIdentity) {
  // The Superuser is not a Member, so it has no Member Profile.
  if (identity.kind === 'member' || identity.kind === 'administrator') {
    return identity.email
  }
  throw new Error('Access denied')
}

export async function getOwnMemberProfile(email: string) {
  const member = await requireActiveMember(email)
  const photo = member.photoId
    ? await getImageStore().get(memberPhotoKey(member.photoId))
    : undefined
  return {
    bio: member.bio,
    photoDataUrl: photo
      ? `data:${photo.contentType};base64,${Buffer.from(photo.body).toString('base64')}`
      : null,
  }
}

export async function updateOwnBio(email: string, bio: string | undefined) {
  const normalized = bio?.trim() || null
  if (normalized && normalized.length > MAX_BIO_LENGTH) {
    throw new Error(`Bio must be ${MAX_BIO_LENGTH} characters or fewer`)
  }
  const member = await requireActiveMember(email)
  await getDb()
    .update(members)
    .set({ bio: normalized, updatedAt: new Date() })
    .where(eq(members.id, member.id))
  return normalized
}

export async function replaceOwnPhoto(email: string, image: StoredImage) {
  const member = await requireActiveMember(email)
  const store = getImageStore()
  const photoId = newImageId(image.contentType)
  await store.put(memberPhotoKey(photoId), image)
  try {
    await setPhoto(member.id, photoId)
  } catch (error) {
    await store.delete(memberPhotoKey(photoId)).catch(() => undefined)
    throw error
  }
  await deleteStoredPhoto(member.photoId)
  return photoId
}

export async function removeOwnPhoto(email: string) {
  const member = await requireActiveMember(email)
  await setPhoto(member.id, null)
  await deleteStoredPhoto(member.photoId)
}

export function memberPhotoKey(photoId: string) {
  return `member-photos/${photoId}`
}

async function requireActiveMember(email: string) {
  const found = await getDb()
    .select({ bio: members.bio, id: members.id, photoId: members.photoId })
    .from(members)
    .where(
      and(
        eq(members.email, email.trim().toLowerCase()),
        eq(members.lifecycle, 'active'),
      ),
    )
  const member = found.at(0)
  if (!member) throw new Error('Access denied')
  return member
}

async function setPhoto(memberId: string, photoId: string | null) {
  await getDb()
    .update(members)
    .set({ photoId, updatedAt: new Date() })
    .where(eq(members.id, memberId))
}

async function deleteStoredPhoto(photoId: string | null) {
  if (!photoId) return
  try {
    await getImageStore().delete(memberPhotoKey(photoId))
  } catch (error) {
    // No Member references it any more, so a leftover object is never served.
    console.error('Unable to delete replaced Member photo', { error, photoId })
  }
}
