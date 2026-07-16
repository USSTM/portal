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

  it('denies an ordinary Administrator', () => {
    expect(() =>
      requireAdministratorManagementAuthority({
        email: 'admin@example.com',
        kind: 'administrator',
      }),
    ).toThrow('Access denied')
  })
})
