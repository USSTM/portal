import { generateKeyPair } from 'jose'
import { describe, expect, it } from 'vitest'

import { signSession } from '@usstm/auth-session'

import { admitPortalRequest } from './access'

describe('Portal admission', () => {
  it('admits the configured Superuser with a valid portal session', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const now = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { audience: 'portal', email: 'admin@example.com', issuedAt: now },
      { key: privateKey, keyId: 'test-key', now: () => now },
    )

    await expect(
      admitPortalRequest(`__Host-portal-session=${token}`, {
        audience: 'portal',
        cookieName: '__Host-portal-session',
        issuer: 'usstm-auth',
        key: publicKey,
        keyId: 'test-key',
        superuserEmail: 'ADMIN@example.com',
        isActiveAdministrator: async () => false,
        isActiveMember: async () => false,
      }),
    ).resolves.toEqual({ email: 'admin@example.com', kind: 'superuser' })
  })

  it('returns the same generic denial for unknown emails and invalid sessions', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const now = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { audience: 'portal', email: 'other@example.com', issuedAt: now },
      { key: privateKey, keyId: 'test-key', now: () => now },
    )
    const dependencies = {
      audience: 'portal',
      cookieName: '__Host-portal-session',
      issuer: 'usstm-auth',
      key: publicKey,
      keyId: 'test-key',
      superuserEmail: 'admin@example.com',
      isActiveAdministrator: async () => false,
      isActiveMember: async () => false,
    }

    await expect(
      admitPortalRequest(`__Host-portal-session=${token}`, dependencies),
    ).resolves.toEqual({ kind: 'denied' })
    await expect(admitPortalRequest(undefined, dependencies)).resolves.toEqual({
      kind: 'denied',
    })
  })

  it('admits an active Administrator without granting Superuser authority', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const now = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { audience: 'portal', email: 'admin@example.com', issuedAt: now },
      { key: privateKey, keyId: 'test-key', now: () => now },
    )

    await expect(
      admitPortalRequest(`__Host-portal-session=${token}`, {
        audience: 'portal',
        cookieName: '__Host-portal-session',
        issuer: 'usstm-auth',
        isActiveAdministrator: async (email) => email === 'admin@example.com',
        isActiveMember: async () => false,
        key: publicKey,
        keyId: 'test-key',
        superuserEmail: 'superuser@example.com',
      }),
    ).resolves.toEqual({ email: 'admin@example.com', kind: 'administrator' })
  })

  it('admits an active Member with Club Access', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const now = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { audience: 'portal', email: 'member@example.com', issuedAt: now },
      { key: privateKey, keyId: 'test-key', now: () => now },
    )

    await expect(
      admitPortalRequest(`__Host-portal-session=${token}`, {
        audience: 'portal',
        cookieName: '__Host-portal-session',
        issuer: 'usstm-auth',
        isActiveAdministrator: async () => false,
        isActiveMember: async (email) => email === 'member@example.com',
        key: publicKey,
        keyId: 'test-key',
        superuserEmail: 'superuser@example.com',
      }),
    ).resolves.toEqual({ email: 'member@example.com', kind: 'member' })
  })
})
