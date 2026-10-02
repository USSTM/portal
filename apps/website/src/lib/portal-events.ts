// Reads Events from the portal's public API (docs/api/events.md). The portal
// is the source of truth for Events; this site never stores its own copy.

export interface PortalClub {
  id: string
  shortName: string
  fullName: string
}

export interface PortalEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  address: string | null
  startAt: string
  endAt: string
  owningClub: PortalClub
  organizingClubs: PortalClub[]
}

// Matches the portal's public Cache-Control max-age.
const REVALIDATE_SECONDS = 60

export function portalEventsUrl(baseUrl: string, from: Date): string {
  const url = new URL('/api/v1/events', baseUrl)
  url.searchParams.set('from', from.toISOString())
  return url.toString()
}

// Returns upcoming and in-progress Events, soonest first. Returns an empty list
// when the portal is unreachable so a portal outage never takes the site down.
export async function getUpcomingPortalEvents({
  limit,
  now = new Date(),
  baseUrl = process.env.PORTAL_PUBLIC_URL,
  fetchImpl = fetch,
}: {
  limit: number
  now?: Date
  baseUrl?: string
  fetchImpl?: typeof fetch
}): Promise<PortalEvent[]> {
  if (!baseUrl) {
    console.error('PORTAL_PUBLIC_URL is not set; skipping portal events')
    return []
  }

  try {
    const response = await fetchImpl(portalEventsUrl(baseUrl, now), {
      next: { revalidate: REVALIDATE_SECONDS },
    } as RequestInit)
    if (!response.ok) {
      console.error(`Portal events request failed with ${response.status}`)
      return []
    }
    const body = (await response.json()) as { events: PortalEvent[] }
    return body.events.slice(0, limit)
  } catch (error) {
    console.error('Portal events request failed', error)
    return []
  }
}
