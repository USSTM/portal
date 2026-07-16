import { Google } from 'arctic'

import type { GoogleBoundary } from './app.js'

export const googleBoundary: GoogleBoundary = {
  createAuthorizationUrl({ clientId, clientSecret, codeVerifier, redirectUri, state }) {
    return new Google(clientId, clientSecret, redirectUri).createAuthorizationURL(
      state,
      codeVerifier,
      ['openid', 'email'],
    )
  },
  async exchangeCode({ clientId, clientSecret, code, codeVerifier, redirectUri }) {
    const tokens = await new Google(
      clientId,
      clientSecret,
      redirectUri,
    ).validateAuthorizationCode(code, codeVerifier)
    return tokens.accessToken()
  },
  async getUserInfo(accessToken) {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw new Error('Google user-info request failed')
    const profile: unknown = await response.json()
    if (typeof profile !== 'object' || profile === null) return {}
    return {
      email: typeof (profile as { email?: unknown }).email === 'string'
        ? (profile as { email: string }).email
        : undefined,
      emailVerified: (profile as { email_verified?: unknown }).email_verified === true,
    }
  },
}
