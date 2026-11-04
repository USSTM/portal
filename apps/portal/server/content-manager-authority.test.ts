import { describe, expect, it, vi } from 'vitest'

import { createContentManagerAuthorityHandler } from './content-manager-authority'

const url = 'http://portal.test/api/website/content-manager-authority'

function handlerFor(authority: boolean) {
  const hasAuthority = vi.fn(async () => authority)
  const handler = createContentManagerAuthorityHandler({
    hasAuthority,
    verifyWebsiteSession: async (token) => {
      if (token !== 'valid-token') throw new Error('invalid session')
      return { email: 'editor@example.com' }
    },
  })
  return { handler, hasAuthority }
}

describe('Content Manager authority for the Website', () => {
  it('reports authority for the verified session email only', async () => {
    const { handler, hasAuthority } = handlerFor(true)
    const response = await handler(
      new Request(url, { headers: { authorization: 'Bearer valid-token' } }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      contentManager: true,
      email: 'editor@example.com',
    })
    expect(hasAuthority).toHaveBeenCalledWith('editor@example.com')
  })

  it('reports a denial for Members without authority', async () => {
    const { handler } = handlerFor(false)
    const response = await handler(
      new Request(url, { headers: { authorization: 'Bearer valid-token' } }),
    )

    expect(await response.json()).toEqual({
      contentManager: false,
      email: 'editor@example.com',
    })
  })

  it.each<{ name: string; headers: Record<string, string> }>([
    { name: 'no token', headers: {} },
    { name: 'a malformed header', headers: { authorization: 'valid-token' } },
    {
      name: 'an invalid session',
      headers: { authorization: 'Bearer forged-token' },
    },
  ])('rejects $name', async ({ headers }) => {
    const { handler, hasAuthority } = handlerFor(true)
    const response = await handler(new Request(url, { headers }))

    expect(response.status).toBe(401)
    expect(hasAuthority).not.toHaveBeenCalled()
  })

  it('allows only GET', async () => {
    const { handler } = handlerFor(true)
    const response = await handler(
      new Request(url, {
        headers: { authorization: 'Bearer valid-token' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET')
  })
})
