import { z } from 'zod'
import { jwtVerify, SignJWT } from 'jose'

export const sessionClaimsSchema = z.object({
  audience: z.string().min(1),
  email: z.string().email(),
  expiresAt: z.number().int().positive(),
  issuedAt: z.number().int().positive(),
})

export type SessionClaims = z.infer<typeof sessionClaimsSchema>

const sessionLifetimeSeconds = 8 * 60 * 60

export async function signSession(
  claims: Omit<SessionClaims, 'expiresAt'>,
  options: {
    key: CryptoKey
    keyId: string
    issuer?: string
    now?: () => number
  },
) {
  const now = options.now?.() ?? Math.floor(Date.now() / 1000)
  const issuer = options.issuer ?? 'usstm-auth'

  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: 'ES256', kid: options.keyId })
    .setIssuer(issuer)
    .setAudience(claims.audience)
    .setIssuedAt(now)
    .setExpirationTime(now + sessionLifetimeSeconds)
    .sign(options.key)
}

export async function verifySession(
  token: string,
  options: {
    audience: string
    issuer: string
    key: CryptoKey
    keyId: string
    now?: () => number
  },
): Promise<SessionClaims> {
  const verified = await jwtVerify(token, options.key, {
    algorithms: ['ES256'],
    audience: options.audience,
    currentDate: new Date((options.now?.() ?? Math.floor(Date.now() / 1000)) * 1000),
    issuer: options.issuer,
  })
  if (verified.protectedHeader.kid !== options.keyId) {
    throw new Error('Session key ID does not match')
  }
  const claims = sessionClaimsSchema.parse({
    audience: verified.payload.aud,
    email: verified.payload.email,
    expiresAt: verified.payload.exp,
    issuedAt: verified.payload.iat,
  })

  const now = options.now?.() ?? Math.floor(Date.now() / 1000)
  if (claims.issuedAt > now) {
    throw new Error('Session issued-at time is in the future')
  }

  return claims
}
