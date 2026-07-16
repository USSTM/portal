import { describe, expect, it } from 'vitest'

import { requireMemberAdministrationAuthority } from './members.js'

describe('Member administration authority', () => {
  it('allows Administrators and the Superuser', () => {
    expect(
      requireMemberAdministrationAuthority({
        email: 'admin@example.com',
        kind: 'administrator',
      }),
    ).toBe('admin@example.com')
  })

  it('denies anonymous visitors', () => {
    expect(() => requireMemberAdministrationAuthority({ kind: 'denied' })).toThrow(
      'Access denied',
    )
  })
})
