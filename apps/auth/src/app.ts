import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import { signSession } from '@usstm/auth-session'

export type GoogleBoundary = {
  createAuthorizationUrl(input: {
    clientId: string
    clientSecret: string
    codeVerifier: string
    redirectUri: string
    state: string
  }): URL
  exchangeCode(input: {
    clientId: string
    clientSecret: string
    code: string
    codeVerifier: string
    redirectUri: string
  }): Promise<string>
  getUserInfo(accessToken: string): Promise<{
    email?: string
    emailVerified?: boolean
  }>
}

export type AuthClient = {
  audience: string
  callbackPath: string
  clientId: string
  clientSecret: string
  cookieName: `__Host-${string}`
  origin: string
}

type AuthDependencies = {
  clients: AuthClient[]
  google: GoogleBoundary
  issuer: string
  key: CryptoKey
  keyId: string
}

type PendingSignIn = { returnTo: string; state: string; verifier: string }

export function createAuthApp(dependencies: AuthDependencies) {
  assertClientsAreValid(dependencies.clients)
  const app = new Hono()
  const clients = new Map(dependencies.clients.map((client) => [client.audience, client]))

  app.get('/auth/health/live', (context) =>
    context.json({ service: 'auth', status: 'ok' }),
  )

  app.get('/auth/sign-in', (context) => {
    const client = getClient(context.req.query('client'), clients)
    const returnTo = context.req.query('returnTo') ?? '/'
    if (!client || !hasExpectedOrigin(context.req.url, client) || !isRelativePath(returnTo)) {
      return context.text('Invalid sign-in request', 400)
    }

    const state = randomUrlValue(32)
    const verifier = randomUrlValue(96)
    const pending: PendingSignIn = { returnTo, state, verifier }
    setCookie(context, pendingCookieName(client), encodeURIComponent(JSON.stringify(pending)), {
      httpOnly: true,
      maxAge: 10 * 60,
      path: '/auth/callback',
      sameSite: 'Lax',
      secure: true,
    })

    return context.redirect(
      dependencies.google
        .createAuthorizationUrl({
          clientId: client.clientId,
          clientSecret: client.clientSecret,
          codeVerifier: verifier,
          redirectUri: `${client.origin}${client.callbackPath}`,
          state,
        })
        .toString(),
    )
  })

  app.get('/auth/*', async (context) => {
    const client = getCallbackClient(context.req.url, dependencies.clients)
    const code = context.req.query('code')
    const state = context.req.query('state')
    if (!client || !code || !state) {
      return context.text('Invalid sign-in response', 400)
    }

    const pending = readPendingSignIn(getCookie(context, pendingCookieName(client)))
    deleteCookie(context, pendingCookieName(client), { path: '/auth/callback' })
    if (!pending || pending.state !== state) {
      return context.text('Invalid sign-in response', 400)
    }

    try {
      const accessToken = await dependencies.google.exchangeCode({
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        code,
        codeVerifier: pending.verifier,
        redirectUri: `${client.origin}${client.callbackPath}`,
      })
      const profile = await dependencies.google.getUserInfo(accessToken)
      const email = profile.email && profile.emailVerified ? normalizeEmail(profile.email) : undefined
      if (!email) return context.text('Access denied', 403)

      const session = await signSession(
        {
          audience: client.audience,
          email,
          issuedAt: Math.floor(Date.now() / 1000),
        },
        { issuer: dependencies.issuer, key: dependencies.key, keyId: dependencies.keyId },
      )
      setCookie(context, client.cookieName, session, {
        httpOnly: true,
        maxAge: 8 * 60 * 60,
        path: '/',
        sameSite: 'Lax',
        secure: true,
      })
      return context.redirect(pending.returnTo)
    } catch {
      return context.text('Unable to complete sign-in', 400)
    }
  })

  app.post('/auth/logout', (context) => {
    const client = getClient(context.req.query('client'), clients)
    const returnTo = context.req.query('returnTo')
    if (
      !client ||
      !hasExpectedOrigin(context.req.url, client) ||
      (returnTo !== undefined && !isRelativePath(returnTo))
    ) {
      return context.text('Invalid logout request', 400)
    }
    deleteCookie(context, client.cookieName, {
      path: '/',
      sameSite: 'Lax',
      secure: true,
    })
    if (returnTo) return context.redirect(returnTo, 303)
    return context.body(null, 204)
  })

  return app
}

function assertClientsAreValid(clients: AuthClient[]) {
  const audiences = new Set<string>()
  const callbacks = new Set<string>()
  for (const client of clients) {
    const callback = `${client.origin}${client.callbackPath}`
    if (
      audiences.has(client.audience) ||
      callbacks.has(callback) ||
      !client.callbackPath.startsWith('/auth/') ||
      client.callbackPath.includes('?') ||
      !client.cookieName.startsWith('__Host-') ||
      new URL(client.origin).origin !== client.origin
    ) {
      throw new Error('Invalid auth client configuration')
    }
    audiences.add(client.audience)
    callbacks.add(callback)
  }
}

function getClient(clientId: string | undefined, clients: Map<string, AuthClient>) {
  return clientId ? clients.get(clientId) : undefined
}

function getCallbackClient(requestUrl: string, clients: AuthClient[]) {
  const url = new URL(requestUrl)
  return clients.find(
    (client) =>
      client.origin === url.origin && client.callbackPath === url.pathname,
  )
}

function hasExpectedOrigin(requestUrl: string, client: AuthClient) {
  return new URL(requestUrl).origin === client.origin
}

function isRelativePath(value: string) {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
}

function pendingCookieName(client: AuthClient) {
  return `${client.audience}-oauth-pending`
}

function readPendingSignIn(value: string | undefined): PendingSignIn | undefined {
  if (!value) return undefined
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value))
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as PendingSignIn).returnTo === 'string' &&
      typeof (parsed as PendingSignIn).state === 'string' &&
      typeof (parsed as PendingSignIn).verifier === 'string'
    ) {
      return parsed as PendingSignIn
    }
  } catch {
    return undefined
  }
  return undefined
}

function randomUrlValue(bytes: number) {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(bytes))).toString('base64url')
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
