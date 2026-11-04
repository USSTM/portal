// Reads the current board and Board Archives from the portal's public APIs
// (docs/api/board.md, docs/api/board-archives.md). The portal is the source of
// truth for both; this site never stores its own copy.

import { websiteImagePath } from './portal-images'

export interface PortalBoardMember {
  displayName: string
  boardPosition: string
  bio: string | null
  photoUrl: string | null
}

export interface PortalBoardArchive {
  academicYear: string
  boardMembers: Array<{ displayName: string; boardPosition: string }>
}

// Matches the portal's public Cache-Control max-age.
const REVALIDATE_SECONDS = 60

type FetchOptions = { baseUrl?: string; fetchImpl?: typeof fetch }

// Returns the current board in its Administrator-set order, or an empty list
// when the portal is unreachable so a portal outage never takes the site down.
export async function getPortalBoard(
  options: FetchOptions = {},
): Promise<PortalBoardMember[]> {
  const body = await fetchPortalJson<{ boardMembers: PortalBoardMember[] }>(
    '/api/v1/board',
    options,
  )
  return body?.boardMembers ?? []
}

// Returns Board Archives newest first, at most `limit` of them, or an empty
// list when the portal is unreachable.
export async function getPortalBoardArchives({
  limit,
  ...options
}: FetchOptions & { limit?: number } = {}): Promise<PortalBoardArchive[]> {
  const body = await fetchPortalJson<{ boardArchives: PortalBoardArchive[] }>(
    '/api/v1/board-archives',
    options,
  )
  const archives = body?.boardArchives ?? []
  return limit ? archives.slice(0, limit) : archives
}

/** Board photos are proxied through this site's /board-photos route. */
export function websiteBoardPhotoPath(photoUrl: string | null) {
  return websiteImagePath(photoUrl, '/api/v1/board-photos', '/board-photos')
}

async function fetchPortalJson<T>(
  path: string,
  { baseUrl = process.env.PORTAL_PUBLIC_URL, fetchImpl = fetch }: FetchOptions,
): Promise<T | undefined> {
  if (!baseUrl) {
    console.error(`PORTAL_PUBLIC_URL is not set; skipping ${path}`)
    return undefined
  }
  try {
    const response = await fetchImpl(new URL(path, baseUrl), {
      next: { revalidate: REVALIDATE_SECONDS },
    } as RequestInit)
    if (!response.ok) {
      console.error(`Portal request ${path} failed with ${response.status}`)
      return undefined
    }
    return (await response.json()) as T
  } catch (error) {
    console.error(`Portal request ${path} failed`, error)
    return undefined
  }
}
