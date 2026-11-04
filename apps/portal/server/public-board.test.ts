import { describe, expect, it, vi } from 'vitest'

import { createPublicBoardHandler } from './public-board'
import { createPublicBoardPhotoHandler } from './public-board-photos'

const board = {
  boardMembers: [
    {
      bio: 'Fourth-year chemistry student.',
      boardPosition: 'President',
      displayName: 'Jane Doe',
      photoUrl: null,
    },
  ],
}

describe('GET /api/v1/board', () => {
  const handler = createPublicBoardHandler({ listBoard: async () => board })

  it('returns the board with public CORS and a short cache', async () => {
    const response = await handler(
      new Request('http://portal.test/api/v1/board'),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('cache-control')).toBe('public, max-age=60')
    expect(await response.json()).toEqual(board)
  })

  it('answers HEAD without a body and rejects other methods', async () => {
    const head = await handler(
      new Request('http://portal.test/api/v1/board', { method: 'HEAD' }),
    )
    const post = await handler(
      new Request('http://portal.test/api/v1/board', { method: 'POST' }),
    )

    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    expect(post.status).toBe(405)
    expect(post.headers.get('allow')).toBe('GET, HEAD')
  })
})

describe('GET /api/v1/board-photos/:id', () => {
  const photoId = `${crypto.randomUUID()}.jpg`
  const body = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])
  const readPhoto = vi.fn(async (id: string) =>
    id === photoId ? { body, contentType: 'image/jpeg' as const } : undefined,
  )
  const handler = createPublicBoardPhotoHandler({ readPhoto })

  it("serves a current Board Member's photo with a short cache", async () => {
    const response = await handler(
      new Request(`http://portal.test/api/v1/board-photos/${photoId}`),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('cache-control')).toBe('public, max-age=300')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(body)
  })

  it('returns 404 for other photos and never looks up malformed IDs', async () => {
    readPhoto.mockClear()
    const other = await handler(
      new Request(
        `http://portal.test/api/v1/board-photos/${crypto.randomUUID()}.png`,
      ),
    )
    const malformed = await handler(
      new Request('http://portal.test/api/v1/board-photos/..%2Fsecret'),
    )

    expect(other.status).toBe(404)
    expect(other.headers.get('cache-control')).toBe('no-store')
    expect(malformed.status).toBe(404)
    expect(readPhoto).toHaveBeenCalledTimes(1)
  })
})
