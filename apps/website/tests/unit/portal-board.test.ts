import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPortalImageProxy } from '@/lib/club-image-proxy'
import {
  getPortalBoard,
  getPortalBoardArchives,
  websiteBoardPhotoPath,
} from '@/lib/portal-board'

const baseUrl = 'http://portal:3000'
const photoId = '0d3f7e52-5b0e-4c1a-9a43-6c1f2b8e9d10.jpg'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getPortalBoard', () => {
  it('reads the current board in API order', async () => {
    const boardMembers = [
      {
        bio: null,
        boardPosition: 'President',
        displayName: 'Jane Doe',
        photoUrl: null,
      },
    ]
    const fetchImpl = vi.fn(async () => Response.json({ boardMembers }))

    await expect(getPortalBoard({ baseUrl, fetchImpl })).resolves.toEqual(
      boardMembers,
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL('http://portal:3000/api/v1/board'),
      expect.anything(),
    )
  })

  it.each([
    ['responds with an error', async () => new Response(null, { status: 500 })],
    [
      'is unreachable',
      async () => {
        throw new TypeError('fetch failed')
      },
    ],
  ])('returns an empty board when the Portal %s', async (_name, fetchImpl) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      getPortalBoard({ baseUrl, fetchImpl: vi.fn(fetchImpl) }),
    ).resolves.toEqual([])
    await expect(
      getPortalBoardArchives({ baseUrl, fetchImpl: vi.fn(fetchImpl) }),
    ).resolves.toEqual([])
  })
})

describe('getPortalBoardArchives', () => {
  it('returns the newest archives up to the limit', async () => {
    const archive = (academicYear: string) => ({
      academicYear,
      boardMembers: [{ boardPosition: 'President', displayName: 'Jane Doe' }],
    })
    const fetchImpl = vi.fn(async () =>
      Response.json({
        boardArchives: [
          archive('2025-2026'),
          archive('2024-2025'),
          archive('2023-2024'),
        ],
      }),
    )

    const archives = await getPortalBoardArchives({
      baseUrl,
      fetchImpl,
      limit: 2,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      new URL('http://portal:3000/api/v1/board-archives'),
      expect.anything(),
    )
    expect(archives.map((entry) => entry.academicYear)).toEqual([
      '2025-2026',
      '2024-2025',
    ])
  })
})

describe('board photos', () => {
  it('maps Portal photo paths to this site', () => {
    expect(websiteBoardPhotoPath(`/api/v1/board-photos/${photoId}`)).toBe(
      `/board-photos/${photoId}`,
    )
    expect(websiteBoardPhotoPath(`/api/v1/club-images/${photoId}`)).toBeNull()
    expect(websiteBoardPhotoPath(null)).toBeNull()
  })

  it('proxies the Portal board photo route', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(Uint8Array.from([0xff, 0xd8, 0xff]), {
          headers: {
            'cache-control': 'public, max-age=300',
            'content-type': 'image/jpeg',
          },
        }),
    )
    const response = await createPortalImageProxy({
      baseUrl,
      fetchImpl,
      portalPath: '/api/v1/board-photos',
    })(new Request(`http://website.test/board-photos/${photoId}`), {
      params: Promise.resolve({ imageId: photoId }),
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      new URL(`http://portal:3000/api/v1/board-photos/${photoId}`),
      { cache: 'no-store' },
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, max-age=300')
  })
})
