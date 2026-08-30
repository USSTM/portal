import { describe, expect, it } from 'vitest'

import { requireBoardMemberAdministrationAuthority } from './board-members.js'

describe('Board Member administration authority', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('allows $kind', (identity) => {
    expect(requireBoardMemberAdministrationAuthority(identity)).toBe(
      identity.email,
    )
  })

  it.each([
    { kind: 'anonymous' as const },
    { email: 'member@example.com', kind: 'member' as const },
    { kind: 'denied' as const },
  ])('denies $kind', (identity) => {
    expect(() => requireBoardMemberAdministrationAuthority(identity)).toThrow(
      'Access denied',
    )
  })
})
