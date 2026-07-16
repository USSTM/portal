import { describe, expect, it } from 'vitest'

import { requireClubAdministrationAuthority } from './clubs.js'

describe('Club administration authority', () => {
  it('allows Administrators and the Superuser', () => {
    expect(
      requireClubAdministrationAuthority({
        email: 'admin@example.com',
        kind: 'administrator',
      }),
    ).toBe('admin@example.com')
    expect(
      requireClubAdministrationAuthority({
        email: 'superuser@example.com',
        kind: 'superuser',
      }),
    ).toBe('superuser@example.com')
  })

  it('denies anonymous visitors', () => {
    expect(() => requireClubAdministrationAuthority({ kind: 'denied' })).toThrow(
      'Access denied',
    )
  })
})
