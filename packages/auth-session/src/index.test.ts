import { describe, expect, it } from 'vitest'
import { generateKeyPair } from 'jose'

import {
  sessionClaimsSchema,
  signSession,
  verifySession,
} from './index.js'

describe('session claims', () => {
  it('accepts the minimal claim set shared by auth clients', () => {
    expect(
      sessionClaimsSchema.parse({
        audience: 'portal',
        email: 'member@example.com',
        expiresAt: 1_800_000_000,
        issuedAt: 1_799_971_200,
      }),
    ).toMatchObject({ audience: 'portal', email: 'member@example.com' })
  })

  it('signs and verifies an audience-bound session', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const now = 1_800_000_000
    const session = await signSession(
      { audience: 'portal', email: 'admin@example.com', issuedAt: now },
      { key: privateKey, keyId: 'test-key', now: () => now },
    )

    await expect(
      verifySession(session, {
        audience: 'portal',
        issuer: 'usstm-auth',
        key: publicKey,
        keyId: 'test-key',
        now: () => now + 1,
      }),
    ).resolves.toMatchObject({
      audience: 'portal',
      email: 'admin@example.com',
      expiresAt: now + 8 * 60 * 60,
      issuedAt: now,
    })
  })

  it('rejects sessions for another audience', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const session = await signSession(
      {
        audience: 'portal',
        email: 'admin@example.com',
        issuedAt: 1_800_000_000,
      },
      { key: privateKey, keyId: 'test-key', now: () => 1_800_000_000 },
    )

    await expect(
      verifySession(session, {
        audience: 'other-app',
        issuer: 'usstm-auth',
        key: publicKey,
        keyId: 'test-key',
        now: () => 1_800_000_001,
      }),
    ).rejects.toThrow()
  })

  it('rejects sessions issued in the future', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const session = await signSession(
      {
        audience: 'portal',
        email: 'admin@example.com',
        issuedAt: 1_800_000_100,
      },
      { key: privateKey, keyId: 'test-key', now: () => 1_800_000_100 },
    )

    await expect(
      verifySession(session, {
        audience: 'portal',
        issuer: 'usstm-auth',
        key: publicKey,
        keyId: 'test-key',
        now: () => 1_800_000_000,
      }),
    ).rejects.toThrow('issued-at')
  })

  it('rejects sessions signed with another key ID', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const session = await signSession(
      {
        audience: 'portal',
        email: 'admin@example.com',
        issuedAt: 1_800_000_000,
      },
      { key: privateKey, keyId: 'old-key', now: () => 1_800_000_000 },
    )

    await expect(
      verifySession(session, {
        audience: 'portal',
        issuer: 'usstm-auth',
        key: publicKey,
        keyId: 'current-key',
        now: () => 1_800_000_001,
      }),
    ).rejects.toThrow('key ID')
  })
})
