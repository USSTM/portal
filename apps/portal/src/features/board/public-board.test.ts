import { describe, expect, it } from 'vitest'

import {
  requireBoardOrderAuthority,
  setBoardPositionOrder,
} from './public-board'

describe('Board Position order', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('may be set by $kind', (identity) => {
    expect(requireBoardOrderAuthority(identity)).toBe(identity.email)
  })

  it.each([
    { email: 'member@example.com', kind: 'member' as const },
    { kind: 'anonymous' as const },
    { kind: 'denied' as const },
  ])('may not be set by $kind', (identity) => {
    expect(() => requireBoardOrderAuthority(identity)).toThrow('Access denied')
  })

  it('rejects blank and repeated positions before touching the database', async () => {
    await expect(setBoardPositionOrder(['President', ' '])).rejects.toThrow(
      'must not be blank',
    )
    await expect(
      setBoardPositionOrder(['President', ' President ']),
    ).rejects.toThrow('only once')
  })
})
