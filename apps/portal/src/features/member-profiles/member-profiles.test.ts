import { describe, expect, it } from 'vitest'

import { requireMemberProfileOwner, updateOwnBio } from './member-profiles'

describe('Member Profile ownership', () => {
  it.each([
    { email: 'member@example.com', kind: 'member' as const },
    { email: 'admin@example.com', kind: 'administrator' as const },
  ])('lets a $kind edit only their own profile', (identity) => {
    expect(requireMemberProfileOwner(identity)).toBe(identity.email)
  })

  it.each([
    { email: 'superuser@example.com', kind: 'superuser' as const },
    { kind: 'anonymous' as const },
    { kind: 'denied' as const },
  ])('denies $kind, which has no Member Profile', (identity) => {
    expect(() => requireMemberProfileOwner(identity)).toThrow('Access denied')
  })
})

describe('Member Profile bio', () => {
  it('rejects a bio over 500 characters before touching the database', async () => {
    await expect(
      updateOwnBio('member@example.com', 'x'.repeat(501)),
    ).rejects.toThrow('500 characters or fewer')
  })
})
