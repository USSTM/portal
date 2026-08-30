import { describe, expect, it } from 'vitest'

import { requireClubAdministrationAuthority } from './clubs.js'

describe('Club administration authority', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('allows $kind', (identity) => {
    expect(requireClubAdministrationAuthority(identity)).toBe(identity.email)
  })

  it.each([
    { kind: 'anonymous' as const },
    { email: 'member@example.com', kind: 'member' as const },
    { kind: 'denied' as const },
  ])('denies $kind', (identity) => {
    expect(() => requireClubAdministrationAuthority(identity)).toThrow(
      'Access denied',
    )
  })
})
