// Reads Clubs and their Club Profiles from the portal's public API
// (docs/api/clubs.md). The portal is the source of truth for Clubs; this site
// never stores its own copy.

import { websiteImagePath } from './portal-images'

export type PortalClubType = 'student_group' | 'course_union'

export interface PortalClubProfile {
  id: string
  shortName: string
  fullName: string
  type: PortalClubType | null
  description: string | null
  imageUrl: string | null
  instagramHandle: string | null
  websiteUrl: string | null
  contactEmail: string | null
}

// Matches the portal's public Cache-Control max-age.
const REVALIDATE_SECONDS = 60

// Returns active Clubs ordered by full name. Returns an empty list when the
// portal is unreachable so a portal outage never takes the site down.
export async function getPortalClubs({
  type,
  baseUrl = process.env.PORTAL_PUBLIC_URL,
  fetchImpl = fetch,
}: {
  type?: PortalClubType
  baseUrl?: string
  fetchImpl?: typeof fetch
} = {}): Promise<PortalClubProfile[]> {
  if (!baseUrl) {
    console.error('PORTAL_PUBLIC_URL is not set; skipping portal clubs')
    return []
  }

  try {
    const response = await fetchImpl(new URL('/api/v1/clubs', baseUrl), {
      next: { revalidate: REVALIDATE_SECONDS },
    } as RequestInit)
    if (!response.ok) {
      console.error(`Portal clubs request failed with ${response.status}`)
      return []
    }
    const body = (await response.json()) as { clubs: PortalClubProfile[] }
    return type ? body.clubs.filter((club) => club.type === type) : body.clubs
  } catch (error) {
    console.error('Portal clubs request failed', error)
    return []
  }
}

/**
 * Club images are served same-origin through this site's /club-images route,
 * which proxies the portal, so the Website CSP needs no extra image origin.
 */
export function websiteClubImagePath(imageUrl: string | null) {
  return websiteImagePath(imageUrl, '/api/v1/club-images', '/club-images')
}

export function instagramUrl(handle: string) {
  return `https://www.instagram.com/${encodeURIComponent(handle)}`
}
