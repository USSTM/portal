import { importJWK } from 'jose'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { admitPortalRequest } from './access'

export const getPortalIdentity = createServerFn({ method: 'GET' }).handler(
  async () => {
    const publicKey = (await importJWK(
      JSON.parse(requiredEnvironment('PORTAL_AUTH_PUBLIC_JWK')),
      'ES256',
    )) as CryptoKey

    return admitPortalRequest(getRequestHeaders().get('cookie') ?? undefined, {
      audience: 'portal',
      cookieName: '__Host-portal-session',
      issuer: requiredEnvironment('PORTAL_AUTH_ISSUER'),
      key: publicKey,
      keyId: requiredEnvironment('PORTAL_AUTH_KEY_ID'),
      superuserEmail: requiredEnvironment('PORTAL_SUPERUSER_EMAIL'),
    })
  },
)

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}
