// Content Managers sign in to Payload through the shared auth service
// (ADR-0008, ADR-0020). The service sets a host-only Website session cookie;
// this module verifies it and asks the Portal, which owns Content Manager
// authority, whether its email may open /admin. Authority is re-checked on
// every request, so a revoked grant takes effect immediately.
import { importJWK } from 'jose'
import type { AuthStrategy, Payload } from 'payload'

import { verifySession } from '@usstm/auth-session'

export const WEBSITE_SESSION_COOKIE = '__Host-website-session'
export const CONTENT_MANAGERS_SLUG = 'content-managers'
export const STRATEGY_NAME = 'usstm-auth'

export type ContentManagerAuthDependencies = {
  /** Resolves the session's email, or throws when the session is invalid. */
  verifyWebsiteSession: (token: string) => Promise<{ email: string }>
  /** Asks the Portal whether the session's bearer is a Content Manager. */
  fetchAuthority: (token: string) => Promise<{
    contentManager: boolean
    email: string
  }>
}

export function readWebsiteSession(headers: Headers): string | undefined {
  return headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === WEBSITE_SESSION_COOKIE)
    ?.slice(1)
    .join('=')
}

/** Keeps post-sign-in redirects inside the admin panel on this origin. */
export function safeReturnTo(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value
  return path &&
    (path === '/admin' || path.startsWith('/admin/')) &&
    !path.includes('\\')
    ? path
    : '/admin'
}

/**
 * Returns the verified email of a Content Manager, or null when the session is
 * missing or invalid, the Member lacks authority, or the Portal is unavailable.
 */
export async function resolveContentManagerEmail(
  headers: Headers,
  dependencies: ContentManagerAuthDependencies,
): Promise<string | null> {
  const token = readWebsiteSession(headers)
  if (!token) return null
  let email: string
  try {
    email = (await dependencies.verifyWebsiteSession(token)).email
  } catch {
    return null
  }
  try {
    const authority = await dependencies.fetchAuthority(token)
    return authority.contentManager && authority.email === email ? email : null
  } catch (error) {
    // Fail closed: without the Portal there is no way to confirm authority.
    console.error('Content Manager authority request failed', error)
    return null
  }
}

export async function findOrCreateContentManager(
  payload: Payload,
  email: string,
) {
  const find = () =>
    payload.find({
      collection: CONTENT_MANAGERS_SLUG,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { email: { equals: email } },
    })
  const existing = (await find()).docs.at(0)
  if (existing) return existing
  try {
    return await payload.create({
      collection: CONTENT_MANAGERS_SLUG,
      data: { email },
      overrideAccess: true,
    })
  } catch (error) {
    // A concurrent first request may have created the row already.
    const created = (await find()).docs.at(0)
    if (created) return created
    throw error
  }
}

export function createContentManagerStrategy(
  dependencies: ContentManagerAuthDependencies = environmentDependencies(),
): AuthStrategy {
  return {
    name: STRATEGY_NAME,
    authenticate: async ({ headers, payload }) => {
      const email = await resolveContentManagerEmail(headers, dependencies)
      if (!email) return { user: null }
      const contentManager = await findOrCreateContentManager(payload, email)
      return {
        user: {
          ...contentManager,
          _strategy: STRATEGY_NAME,
          collection: CONTENT_MANAGERS_SLUG,
        },
      }
    },
  }
}

export function environmentDependencies(): ContentManagerAuthDependencies {
  let publicKey: Promise<CryptoKey> | undefined
  return {
    verifyWebsiteSession: async (token) =>
      verifySession(token, {
        audience: 'website',
        issuer: requiredEnvironment('WEBSITE_AUTH_ISSUER'),
        key: await (publicKey ??= importJWK(
          JSON.parse(requiredEnvironment('WEBSITE_AUTH_PUBLIC_JWK')),
          'ES256',
        ) as Promise<CryptoKey>),
        keyId: requiredEnvironment('WEBSITE_AUTH_KEY_ID'),
      }),
    fetchAuthority: async (token) => {
      const response = await fetch(
        new URL(
          '/api/website/content-manager-authority',
          requiredEnvironment('PORTAL_PUBLIC_URL'),
        ),
        { cache: 'no-store', headers: { authorization: `Bearer ${token}` } },
      )
      if (!response.ok) {
        throw new Error(`Portal responded with ${response.status}`)
      }
      return (await response.json()) as {
        contentManager: boolean
        email: string
      }
    },
  }
}

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}
