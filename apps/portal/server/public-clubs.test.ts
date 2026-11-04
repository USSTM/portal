import { describe, expect, it, vi } from 'vitest'

import { createPublicClubImageHandler } from './public-club-images'
import { createPublicClubsHandler } from './public-clubs'

const clubs = {
  clubs: [
    {
      contactEmail: 'club@example.com',
      description: 'We build robots.',
      fullName: 'Robotics Club',
      id: crypto.randomUUID(),
      imageUrl: null,
      instagramHandle: 'robotics',
      shortName: 'RC',
      type: 'student_group' as const,
      websiteUrl: 'https://robotics.example.com',
    },
  ],
}

describe('GET /api/v1/clubs', () => {
  const handler = createPublicClubsHandler({ listClubs: async () => clubs })

  it('returns Clubs with public CORS and a short cache', async () => {
    const response = await handler(
      new Request('http://portal.test/api/v1/clubs'),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('cache-control')).toBe('public, max-age=60')
    expect(await response.json()).toEqual(clubs)
  })

  it('answers HEAD without a body', async () => {
    const response = await handler(
      new Request('http://portal.test/api/v1/clubs', { method: 'HEAD' }),
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('')
  })

  it.each(['POST', 'PUT', 'DELETE'])('rejects %s', async (method) => {
    const response = await handler(
      new Request('http://portal.test/api/v1/clubs', { method }),
    )

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, HEAD')
  })
})

describe('GET /api/v1/club-images/:id', () => {
  const imageId = `${crypto.randomUUID()}.png`
  const body = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const readImage = vi.fn(async (id: string) =>
    id === imageId ? { body, contentType: 'image/png' as const } : undefined,
  )
  const handler = createPublicClubImageHandler({ readImage })

  it('serves an active Club image with its detected type', async () => {
    const response = await handler(
      new Request(`http://portal.test/api/v1/club-images/${imageId}`),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(body)
  })

  it('returns 404 for unknown images and never looks up malformed IDs', async () => {
    readImage.mockClear()
    const unknown = await handler(
      new Request(
        `http://portal.test/api/v1/club-images/${crypto.randomUUID()}.png`,
      ),
    )
    const malformed = await handler(
      new Request('http://portal.test/api/v1/club-images/..%2Fsecret'),
    )

    expect(unknown.status).toBe(404)
    expect(malformed.status).toBe(404)
    expect(readImage).toHaveBeenCalledTimes(1)
  })
})
