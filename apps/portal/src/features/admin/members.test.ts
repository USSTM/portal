import { describe, expect, it } from 'vitest'

import { requireMemberAdministrationAuthority } from './members.js'

describe('Member administration authority', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('allows $kind', (identity) => {
    expect(requireMemberAdministrationAuthority(identity)).toBe(identity.email)
  })

  it.each([
    { kind: 'anonymous' as const },
    { email: 'member@example.com', kind: 'member' as const },
    { kind: 'denied' as const },
  ])('denies $kind', (identity) => {
    expect(() => requireMemberAdministrationAuthority(identity)).toThrow(
      'Access denied',
    )
  })
})
