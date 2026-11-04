import { afterEach, describe, expect, it, vi } from 'vitest'

import { createClubImageProxy } from '@/lib/club-image-proxy'
import {
  getPortalClubs,
  instagramUrl,
  websiteClubImagePath,
  type PortalClubProfile,
} from '@/lib/portal-clubs'

const imageId = '0d3f7e52-5b0e-4c1a-9a43-6c1f2b8e9d10.png'
const baseUrl = 'http://portal:3000'

const club = (
  id: string,
  type: PortalClubProfile['type'],
): PortalClubProfile => ({
  contactEmail: null,
  description: null,
  fullName: `Club ${id}`,
  id,
  imageUrl: null,
  instagramHandle: null,
  shortName: id,
  type,
  websiteUrl: null,
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getPortalClubs', () => {
  it('reads Clubs from the public API and filters by type', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        clubs: [
          club('a', 'student_group'),
          club('b', 'course_union'),
          club('c', null),
        ],
      }),
    )

    const all = await getPortalClubs({ baseUrl, fetchImpl })
    const unions = await getPortalClubs({
      baseUrl,
      fetchImpl,
      type: 'course_union',
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      new URL('http://portal:3000/api/v1/clubs'),
      expect.anything(),
    )
    expect(all.map((entry) => entry.id)).toEqual(['a', 'b', 'c'])
    expect(unions.map((entry) => entry.id)).toEqual(['b'])
  })

  it.each([
    ['responds with an error', async () => new Response(null, { status: 503 })],
    [
      'is unreachable',
      async () => {
        throw new TypeError('fetch failed')
      },
    ],
  ])('returns no Clubs when the Portal %s', async (_name, fetchImpl) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      getPortalClubs({ baseUrl, fetchImpl: vi.fn(fetchImpl) }),
    ).resolves.toEqual([])
  })

  it('returns no Clubs when the Portal address is not configured', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchImpl = vi.fn()

    await expect(getPortalClubs({ baseUrl: '', fetchImpl })).resolves.toEqual(
      [],
    )
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('Club links', () => {
  it('maps Portal image paths to this site', () => {
    expect(websiteClubImagePath(`/api/v1/club-images/${imageId}`)).toBe(
      `/club-images/${imageId}`,
    )
    expect(websiteClubImagePath(null)).toBeNull()
    expect(websiteClubImagePath('https://evil.test/x.png')).toBeNull()
  })

  it('builds Instagram profile links', () => {
    expect(instagramUrl('robotics.tmu')).toBe(
      'https://www.instagram.com/robotics.tmu',
    )
  })
})

describe('Club image proxy', () => {
  const params = (id: string) => ({ params: Promise.resolve({ imageId: id }) })

  it('passes a Portal image through with its type and cache headers', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(Uint8Array.from([1, 2, 3]), {
          headers: {
            'cache-control': 'public, max-age=86400',
            'content-type': 'image/png',
            'set-cookie': 'leak=1',
          },
        }),
    )
    const response = await createClubImageProxy({ baseUrl, fetchImpl })(
      new Request(`http://website.test/club-images/${imageId}`),
      params(imageId),
    )

    expect(fetchImpl).toHaveBeenCalledWith(
      new URL(`http://portal:3000/api/v1/club-images/${imageId}`),
      { cache: 'no-store' },
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      Uint8Array.from([1, 2, 3]),
    )
  })

  it('returns 404 for malformed IDs without asking the Portal', async () => {
    const fetchImpl = vi.fn()
    const response = await createClubImageProxy({ baseUrl, fetchImpl })(
      new Request('http://website.test/club-images/x'),
      params('../../api/v1/clubs'),
    )

    expect(response.status).toBe(404)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns 404 when the Portal has no such image or is down', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const missing = createClubImageProxy({
      baseUrl,
      fetchImpl: vi.fn(async () => new Response(null, { status: 404 })),
    })
    const down = createClubImageProxy({
      baseUrl,
      fetchImpl: vi.fn(async () => {
        throw new TypeError('fetch failed')
      }),
    })
    const request = new Request(`http://website.test/club-images/${imageId}`)

    expect((await missing(request, params(imageId))).status).toBe(404)
    expect((await down(request, params(imageId))).status).toBe(404)
  })
})
