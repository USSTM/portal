import { importJWK } from 'jose'

import { verifySession } from '@usstm/auth-session'

import { hasContentManagerAuthorityForEmail } from '../src/features/admin/content-managers.js'

// Answers whether the bearer of a Website session is a Content Manager. The
// caller proves the identity with its own signed session, so the response only
// ever describes that caller and needs no shared secret between the apps.
type Dependencies = {
  hasAuthority: (email: string) => Promise<boolean>
  verifyWebsiteSession: (token: string) => Promise<{ email: string }>
}

export function createContentManagerAuthorityHandler(
  dependencies: Dependencies,
) {
  return async function contentManagerAuthority(request: Request) {
    const headers = new Headers({ 'Cache-Control': 'no-store' })
    if (request.method !== 'GET') {
      headers.set('Allow', 'GET')
      return new Response(null, { headers, status: 405 })
    }

    const token = request.headers
      .get('authorization')
      ?.match(/^Bearer (\S+)$/)?.[1]
    if (!token) return new Response(null, { headers, status: 401 })

    let email: string
    try {
      email = (await dependencies.verifyWebsiteSession(token)).email
    } catch {
      return new Response(null, { headers, status: 401 })
    }

    return Response.json(
      { contentManager: await dependencies.hasAuthority(email), email },
      { headers },
    )
  }
}

let websitePublicKey: Promise<CryptoKey> | undefined

export default createContentManagerAuthorityHandler({
  hasAuthority: (email) =>
    hasContentManagerAuthorityForEmail(
      email,
      requiredEnvironment('PORTAL_SUPERUSER_EMAIL'),
    ),
  verifyWebsiteSession: async (token) =>
    verifySession(token, {
      audience: 'website',
      issuer: requiredEnvironment('PORTAL_AUTH_ISSUER'),
      key: await (websitePublicKey ??= importJWK(
        JSON.parse(requiredEnvironment('PORTAL_AUTH_PUBLIC_JWK')),
        'ES256',
      ) as Promise<CryptoKey>),
      keyId: requiredEnvironment('PORTAL_AUTH_KEY_ID'),
    }),
})

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}
