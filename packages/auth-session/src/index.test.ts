import { describe, expect, it } from 'vitest'

import { sessionClaimsSchema } from './index.js'

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
})
