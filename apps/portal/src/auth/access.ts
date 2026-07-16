import { verifySession } from '@usstm/auth-session'

export type PortalIdentity =
  | { email: string; kind: 'superuser' }
  | { email: string; kind: 'administrator' }
  | { email: string; kind: 'member' }
  | { kind: 'denied' }

export async function admitPortalRequest(
  cookieHeader: string | undefined,
  dependencies: {
    audience: string
    cookieName: string
    issuer: string
    key: CryptoKey
    keyId: string
    superuserEmail: string
    isActiveAdministrator: (email: string) => Promise<boolean>
    isActiveMember: (email: string) => Promise<boolean>
  },
): Promise<PortalIdentity> {
  const token = getCookie(cookieHeader, dependencies.cookieName)
  if (!token) return { kind: 'denied' }

  try {
    const session = await verifySession(token, {
      audience: dependencies.audience,
      issuer: dependencies.issuer,
      key: dependencies.key,
      keyId: dependencies.keyId,
    })
    if (session.email === normalizeEmail(dependencies.superuserEmail)) {
      return { email: session.email, kind: 'superuser' }
    }
    if (await dependencies.isActiveAdministrator(session.email)) {
      return { email: session.email, kind: 'administrator' }
    }
    if (await dependencies.isActiveMember(session.email)) {
      return { email: session.email, kind: 'member' }
    }
  } catch {
    // Deliberately indistinguishable from an unknown email or missing session.
  }
  return { kind: 'denied' }
}

function getCookie(header: string | undefined, name: string) {
  if (!header) return undefined
  return header
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([cookieName]) => cookieName === name)?.slice(1).join('=')
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
