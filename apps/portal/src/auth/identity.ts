import { importJWK } from 'jose'
import { and, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { admitPortalRequest } from './access'
import { getDb } from '../db/index.js'
import { administrators, members } from '../db/schema.js'

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
      isActiveAdministrator: async (email) => {
        const administratorsFound = await getDb()
          .select({ memberId: administrators.memberId })
          .from(administrators)
          .innerJoin(members, eq(administrators.memberId, members.id))
          .where(and(eq(members.email, email), eq(members.lifecycle, 'active')))
        return administratorsFound.length > 0
      },
    })
  },
)

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}
