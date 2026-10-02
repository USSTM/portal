import { describe, expect, it, vi } from 'vitest'
import {
  getUpcomingPortalEvents,
  portalEventsUrl,
  type PortalEvent,
} from '@/lib/portal-events'

const event = (id: string): PortalEvent => ({
  id,
  title: `Event ${id}`,
  description: null,
  location: null,
  address: null,
  startAt: '2026-09-15T18:00:00-04:00',
  endAt: '2026-09-15T20:00:00-04:00',
  owningClub: { id: 'c1', shortName: 'USSTM', fullName: 'USSTM' },
  organizingClubs: [],
})

const now = new Date('2026-09-01T00:00:00Z')

describe('portalEventsUrl', () => {
  it('requests events overlapping from now onward', () => {
    expect(portalEventsUrl('https://portal.usstm.ca', now)).toBe(
      'https://portal.usstm.ca/api/v1/events?from=2026-09-01T00%3A00%3A00.000Z',
    )
  })
})

describe('getUpcomingPortalEvents', () => {
  it('returns at most limit events in API order', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ events: [event('1'), event('2'), event('3')] }),
    )

    const events = await getUpcomingPortalEvents({
      limit: 2,
      now,
      baseUrl: 'https://portal.usstm.ca',
      fetchImpl,
    })

    expect(events.map((e) => e.id)).toEqual(['1', '2'])
  })

  it('returns no events when the portal responds with an error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => new Response(null, { status: 503 }))

    await expect(
      getUpcomingPortalEvents({
        limit: 6,
        now,
        baseUrl: 'https://portal.usstm.ca',
        fetchImpl,
      }),
    ).resolves.toEqual([])
  })

  it('returns no events when the portal is unreachable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })

    await expect(
      getUpcomingPortalEvents({
        limit: 6,
        now,
        baseUrl: 'https://portal.usstm.ca',
        fetchImpl,
      }),
    ).resolves.toEqual([])
  })
})
