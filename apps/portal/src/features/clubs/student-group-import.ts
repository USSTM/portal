import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '../../db/index.js'
import { clubs } from '../../db/schema.js'
import { validateImage } from '../../storage/images.js'

import { replaceClubImage, updateClubProfile } from './club-profiles.js'
import type {
  ClubProfileActor,
  ClubProfileInput,
  ClubType,
} from './club-profiles.js'

// One-time copy of the Website's retired Student Groups into Club Profiles
// (ticket 08). Reads the JSON written by the Website's
// `export:student-groups` script. Only empty Club Profile fields are filled, so
// anything a Club has already edited in the Portal is kept.

export const exportedStudentGroupsSchema = z.array(
  z.object({
    active: z.boolean(),
    contactEmail: z.string().nullable(),
    description: z.string().nullable(),
    instagram: z.string().nullable(),
    logoUrl: z.string().url().nullable(),
    name: z.string().min(1),
    shortName: z.string().nullable(),
    type: z.enum(['student_group', 'course_union']).nullable(),
    website: z.string().nullable(),
  }),
)

export type ExportedStudentGroup = z.infer<
  typeof exportedStudentGroupsSchema
>[number]

export type ClubForImport = {
  contactEmail: string | null
  description: string | null
  fullName: string
  id: string
  imageId: string | null
  instagramHandle: string | null
  shortName: string
  type: ClubType | null
  websiteUrl: string | null
}

export type PlannedClubProfile = {
  club: ClubForImport
  group: string
  /** The complete profile to save: existing values plus filled blanks. */
  profile: ClubProfileInput
  filled: string[]
  skipped: string[]
  logoUrl: string | null
}

export type ClubProfileImportPlan = {
  matched: PlannedClubProfile[]
  unmatched: Array<{ group: string; shortName: string | null; reason: string }>
}

export function planClubProfileImport(
  groups: ExportedStudentGroup[],
  activeClubs: ClubForImport[],
): ClubProfileImportPlan {
  const plan: ClubProfileImportPlan = { matched: [], unmatched: [] }
  const claimed = new Map<string, string>()

  for (const group of groups) {
    const unmatched = (reason: string) =>
      plan.unmatched.push({
        group: group.name,
        reason,
        shortName: group.shortName,
      })
    if (!group.active) {
      unmatched('Student Group was inactive on the Website')
      continue
    }
    const candidates = findCandidates(group, activeClubs)
    if (candidates.length === 0) {
      unmatched('No active Club has a matching short or full name')
      continue
    }
    if (candidates.length > 1) {
      unmatched(
        `Matches several Clubs: ${candidates.map((club) => club.shortName).join(', ')}`,
      )
      continue
    }
    const club = candidates[0]
    const claimedBy = claimed.get(club.id)
    if (claimedBy) {
      unmatched(`Club ${club.shortName} already matched ${claimedBy}`)
      continue
    }
    claimed.set(club.id, group.name)
    plan.matched.push(planProfile(group, club))
  }
  return plan
}

export async function applyClubProfileImport(
  plan: ClubProfileImportPlan,
  actor: ClubProfileActor,
  fetchImpl: typeof fetch = fetch,
) {
  const results = []
  for (const entry of plan.matched) {
    if (entry.filled.length > 0) {
      await updateClubProfile({
        actor,
        clubId: entry.club.id,
        profile: entry.profile,
      })
    }
    results.push({
      club: entry.club.shortName,
      filled: entry.filled,
      group: entry.group,
      image: await copyLogo(entry, actor, fetchImpl),
      skipped: entry.skipped,
    })
  }
  return results
}

export async function listClubsForImport(): Promise<ClubForImport[]> {
  return getDb()
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
    .where(eq(clubs.lifecycle, 'active'))
    .orderBy(asc(clubs.shortName))
}

export function normalizeInstagramHandle(value: string) {
  const handle = value
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '')
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : undefined
}

function planProfile(
  group: ExportedStudentGroup,
  club: ClubForImport,
): PlannedClubProfile {
  const filled: string[] = []
  const skipped: string[] = []
  const profile: ClubProfileInput = {
    contactEmail: club.contactEmail ?? undefined,
    description: club.description ?? undefined,
    instagramHandle: club.instagramHandle ?? undefined,
    type: club.type ?? undefined,
    websiteUrl: club.websiteUrl ?? undefined,
  }
  const fill = <TField extends keyof ClubProfileInput>(
    field: TField,
    value: ClubProfileInput[TField] | undefined,
    problem?: string,
  ) => {
    if (profile[field] !== undefined) return
    if (problem) {
      skipped.push(`${field}: ${problem}`)
      return
    }
    if (value === undefined) return
    profile[field] = value
    filled.push(field)
  }

  fill('type', group.type ?? undefined)
  if (group.description) {
    fill(
      'description',
      group.description,
      group.description.length > 1000
        ? 'longer than 1000 characters'
        : undefined,
    )
  }
  if (group.instagram) {
    const handle = normalizeInstagramHandle(group.instagram)
    fill(
      'instagramHandle',
      handle,
      handle ? undefined : `"${group.instagram}" is not an Instagram handle`,
    )
  }
  if (group.website) {
    const valid = isHttpsUrl(group.website.trim())
    fill(
      'websiteUrl',
      group.website.trim(),
      valid ? undefined : `"${group.website}" is not an https:// URL`,
    )
  }
  if (group.contactEmail) {
    const email = group.contactEmail.trim().toLowerCase()
    const valid = z.string().email().safeParse(email).success
    fill(
      'contactEmail',
      email,
      valid ? undefined : `"${group.contactEmail}" is not an email address`,
    )
  }

  return {
    club,
    filled,
    group: group.name,
    logoUrl: club.imageId ? null : group.logoUrl,
    profile,
    skipped,
  }
}

async function copyLogo(
  entry: PlannedClubProfile,
  actor: ClubProfileActor,
  fetchImpl: typeof fetch,
) {
  if (entry.club.imageId) return 'kept existing image'
  if (!entry.logoUrl) return 'no logo'
  try {
    const response = await fetchImpl(entry.logoUrl)
    if (!response.ok) return `logo download failed with ${response.status}`
    const image = validateImage(new Uint8Array(await response.arrayBuffer()))
    await replaceClubImage({ actor, clubId: entry.club.id, image })
    return 'copied'
  } catch (error) {
    return `logo not copied: ${error instanceof Error ? error.message : String(error)}`
  }
}

function findCandidates(
  group: ExportedStudentGroup,
  activeClubs: ClubForImport[],
) {
  const key = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
  if (group.shortName) {
    const byShortName = activeClubs.filter(
      (club) => key(club.shortName) === key(group.shortName ?? ''),
    )
    if (byShortName.length > 0) return byShortName
  }
  return activeClubs.filter(
    (club) =>
      key(club.fullName) === key(group.name) ||
      key(club.shortName) === key(group.name),
  )
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
