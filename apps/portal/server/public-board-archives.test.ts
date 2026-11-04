import { describe, expect, it } from 'vitest'

import { createPublicBoardArchivesHandler } from './public-board-archives'

const archives = {
  boardArchives: [
    {
      academicYear: '2025-2026',
      boardMembers: [{ boardPosition: 'President', displayName: 'Jane Doe' }],
    },
  ],
}

describe('GET /api/v1/board-archives', () => {
  const handler = createPublicBoardArchivesHandler({
    listArchives: async () => archives,
  })
  const url = 'http://portal.test/api/v1/board-archives'

  it('returns archives with public CORS and a short cache', async () => {
    const response = await handler(new Request(url))

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('cache-control')).toBe('public, max-age=60')
    expect(await response.json()).toEqual(archives)
  })

  it('answers HEAD without a body and rejects other methods', async () => {
    const head = await handler(new Request(url, { method: 'HEAD' }))
    const del = await handler(new Request(url, { method: 'DELETE' }))

    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    expect(del.status).toBe(405)
    expect(del.headers.get('allow')).toBe('GET, HEAD')
  })
})
