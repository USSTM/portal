import { describe, expect, it } from 'vitest'

import { requireBoardMemberAdministrationAuthority } from './board-members.js'

describe('Board Member administration authority', () => {
  it('allows Administrators and the Superuser', () => {
    expect(
      requireBoardMemberAdministrationAuthority({
        email: 'admin@example.com',
        kind: 'administrator',
      }),
    ).toBe('admin@example.com')
  })

  it('denies regular Members', () => {
    expect(() =>
      requireBoardMemberAdministrationAuthority({
        email: 'member@example.com',
        kind: 'member',
      }),
    ).toThrow('Access denied')
  })
})
