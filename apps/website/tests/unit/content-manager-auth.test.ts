import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import {
  createContentManagerStrategy,
  readWebsiteSession,
  resolveContentManagerEmail,
  safeReturnTo,
  type ContentManagerAuthDependencies,
} from '@/lib/content-manager-auth'

const email = 'editor@example.com'

function sessionHeaders(token = 'valid-token') {
  return new Headers({
    cookie: `theme=dark; __Host-website-session=${token}; other=value`,
  })
}

function dependencies(
  authority: { contentManager: boolean; email: string } | Error,
): ContentManagerAuthDependencies {
  return {
    fetchAuthority: vi.fn(async () => {
      if (authority instanceof Error) throw authority
      return authority
    }),
    verifyWebsiteSession: vi.fn(async (token: string) => {
      if (token !== 'valid-token') throw new Error('invalid session')
      return { email }
    }),
  }
}

function fakePayload(existing: Array<{ id: number; email: string }> = []) {
  return {
    create: vi.fn(async ({ data }: { data: { email: string } }) => ({
      createdAt: 'now',
      email: data.email,
      id: 7,
      updatedAt: 'now',
    })),
    find: vi.fn(async () => ({ docs: existing })),
  }
}

describe('readWebsiteSession', () => {
  it('reads only the Website session cookie', () => {
    expect(readWebsiteSession(sessionHeaders('a.b=c'))).toBe('a.b=c')
    expect(
      readWebsiteSession(new Headers({ cookie: '__Host-portal-session=x' })),
    ).toBeUndefined()
  })
})

describe('resolveContentManagerEmail', () => {
  it('admits a Content Manager confirmed by the Portal', async () => {
    const deps = dependencies({ contentManager: true, email })
    await expect(
      resolveContentManagerEmail(sessionHeaders(), deps),
    ).resolves.toBe(email)
    expect(deps.fetchAuthority).toHaveBeenCalledWith('valid-token')
  })

  it('denies a Member without Content Manager authority', async () => {
    await expect(
      resolveContentManagerEmail(
        sessionHeaders(),
        dependencies({ contentManager: false, email }),
      ),
    ).resolves.toBeNull()
  })

  it('denies when the Portal answers for a different email', async () => {
    await expect(
      resolveContentManagerEmail(
        sessionHeaders(),
        dependencies({ contentManager: true, email: 'other@example.com' }),
      ),
    ).resolves.toBeNull()
  })

  it('denies without asking the Portal when the session is missing or invalid', async () => {
    const deps = dependencies({ contentManager: true, email })
    await expect(
      resolveContentManagerEmail(new Headers(), deps),
    ).resolves.toBeNull()
    await expect(
      resolveContentManagerEmail(sessionHeaders('forged-token'), deps),
    ).resolves.toBeNull()
    expect(deps.fetchAuthority).not.toHaveBeenCalled()
  })

  it('fails closed when the Portal is unavailable', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(
      resolveContentManagerEmail(
        sessionHeaders(),
        dependencies(new Error('connect ECONNREFUSED')),
      ),
    ).resolves.toBeNull()
    consoleError.mockRestore()
  })
})

describe('Content Manager auth strategy', () => {
  it('returns the stored Content Manager for an admitted session', async () => {
    const payload = fakePayload([{ email, id: 3 }])
    const strategy = createContentManagerStrategy(
      dependencies({ contentManager: true, email }),
    )

    const result = await strategy.authenticate({
      headers: sessionHeaders(),
      payload: payload as unknown as Payload,
    })

    expect(result.user).toMatchObject({
      _strategy: 'usstm-auth',
      collection: 'content-managers',
      email,
      id: 3,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('records a Content Manager on first sign-in', async () => {
    const payload = fakePayload()
    const strategy = createContentManagerStrategy(
      dependencies({ contentManager: true, email }),
    )

    const result = await strategy.authenticate({
      headers: sessionHeaders(),
      payload: payload as unknown as Payload,
    })

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'content-managers',
        data: { email },
        overrideAccess: true,
      }),
    )
    expect(result.user).toMatchObject({ email, id: 7 })
  })

  it('returns no user and stores nothing for a denied Member', async () => {
    const payload = fakePayload()
    const strategy = createContentManagerStrategy(
      dependencies({ contentManager: false, email }),
    )

    const result = await strategy.authenticate({
      headers: sessionHeaders(),
      payload: payload as unknown as Payload,
    })

    expect(result.user).toBeNull()
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })
})

describe('safeReturnTo', () => {
  it.each([
    [undefined, '/admin'],
    ['/admin/collections/pages', '/admin/collections/pages'],
    [['/admin/globals', '/x'], '/admin/globals'],
    ['/administrator', '/admin'],
    ['https://evil.example/admin', '/admin'],
    ['//evil.example', '/admin'],
    ['/admin\\..\\x', '/admin'],
  ])('maps %j to %s', (value, expected) => {
    expect(safeReturnTo(value)).toBe(expected)
  })
})
