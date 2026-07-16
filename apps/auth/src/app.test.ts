import { describe, expect, it } from 'vitest'
import { generateKeyPair } from 'jose'

import { createAuthApp, type GoogleBoundary } from './app.js'

describe('auth liveness', () => {
  it('reports that the auth service is healthy', async () => {
    const response = await app().request('http://portal.test/auth/health/live')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      service: 'auth',
      status: 'ok',
    })
  })
})

describe('Google sign-in', () => {
  it('redirects an allowlisted client to Google with state and PKCE', async () => {
    const google = fakeGoogle()
    const response = await app({ google }).request(
      'https://portal.test/auth/sign-in?client=portal&returnTo=/account',
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toMatch(
      /^https:\/\/accounts\.google\.test\/authorize\?state=/,
    )
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(google.authorizationRequest).toMatchObject({
      clientId: 'portal-client',
      redirectUri: 'https://portal.test/auth/callback',
    })
    expect(google.authorizationRequest?.codeVerifier).toHaveLength(128)
  })

  it('creates an eight-hour host-only cookie after a verified Google email', async () => {
    const google = fakeGoogle({ email: ' Admin@Example.com ', emailVerified: true })
    const auth = app({ google })
    const signIn = await auth.request(
      'https://portal.test/auth/sign-in?client=portal&returnTo=/account',
    )
    const state = new URL(signIn.headers.get('location')!).searchParams.get('state')!
    const cookie = signIn.headers.get('set-cookie')!

    const response = await auth.request(
      `https://portal.test/auth/callback?code=code&state=${state}`,
      { headers: { cookie } },
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/account')
    expect(response.headers.get('set-cookie')).toContain('__Host-portal-session=')
    expect(response.headers.get('set-cookie')).toContain('Max-Age=28800')
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(response.headers.get('set-cookie')).toContain('Secure')
    expect(response.headers.get('set-cookie')).toContain('SameSite=Lax')
    expect(response.headers.get('set-cookie')).not.toContain('Domain=')
  })

  it('rejects unknown clients and unsafe return paths', async () => {
    const auth = app()

    expect(
      (await auth.request('https://portal.test/auth/sign-in?client=unknown')).status,
    ).toBe(400)
    expect(
      (
        await auth.request(
          'https://portal.test/auth/sign-in?client=portal&returnTo=https://evil.test',
        )
      ).status,
    ).toBe(400)
    expect(
      (await auth.request('https://evil.test/auth/sign-in?client=portal')).status,
    ).toBe(400)
  })

  it('rejects unverified Google email addresses', async () => {
    const google = fakeGoogle({ email: 'admin@example.com', emailVerified: false })
    const auth = app({ google })
    const signIn = await auth.request(
      'https://portal.test/auth/sign-in?client=portal',
    )
    const state = new URL(signIn.headers.get('location')!).searchParams.get('state')!

    expect(
      (
        await auth.request(
          `https://portal.test/auth/callback?code=code&state=${state}`,
          { headers: { cookie: signIn.headers.get('set-cookie')! } },
        )
      ).status,
    ).toBe(403)
  })

  it('logout clears only the configured application session cookie', async () => {
    const response = await app().request(
      'https://portal.test/auth/logout?client=portal',
      { method: 'POST' },
    )

    expect(response.status).toBe(204)
    expect(response.headers.get('set-cookie')).toContain(
      '__Host-portal-session=; Max-Age=0',
    )
    expect(response.headers.get('set-cookie')).not.toContain('oauth-pending')
  })
})

function app({ google = fakeGoogle() }: { google?: GoogleBoundary } = {}) {
  return createAuthApp({
    clients: [
      {
        audience: 'portal',
        callbackPath: '/auth/callback',
        clientId: 'portal-client',
        clientSecret: 'portal-secret',
        cookieName: '__Host-portal-session',
        origin: 'https://portal.test',
      },
    ],
    google,
    issuer: 'usstm-auth',
    key: privateKey,
    keyId: 'test-key',
  })
}

const { privateKey } = await generateKeyPair('ES256')

function fakeGoogle(
  profile: { email?: string; emailVerified?: boolean } = {},
): GoogleBoundary & { authorizationRequest?: Record<string, string> } {
  return {
    async exchangeCode() {
      return 'access-token'
    },
    async getUserInfo() {
      return {
        email: profile.email ?? 'admin@example.com',
        emailVerified: profile.emailVerified ?? true,
      }
    },
    authorizationRequest: undefined,
    createAuthorizationUrl(input) {
      this.authorizationRequest = input
      const url = new URL('https://accounts.google.test/authorize')
      url.searchParams.set('state', input.state)
      return url
    },
  }
}
