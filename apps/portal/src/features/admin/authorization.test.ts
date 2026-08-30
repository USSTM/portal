import { describe, expect, it } from 'vitest'

import { requireAdministratorManagementAuthority } from './authorization.js'

describe('Administrator management authority', () => {
  it('allows the Superuser', () => {
    expect(
      requireAdministratorManagementAuthority({
        email: 'superuser@example.com',
        kind: 'superuser',
      }),
    ).toBe('superuser@example.com')
  })

  it.each([
    { kind: 'anonymous' as const },
    { email: 'member@example.com', kind: 'member' as const },
    { email: 'admin@example.com', kind: 'administrator' as const },
    { kind: 'denied' as const },
  ])('denies $kind', (identity) => {
    expect(() => requireAdministratorManagementAuthority(identity)).toThrow(
      'Access denied',
    )
  })
})
