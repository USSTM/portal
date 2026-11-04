import { describe, expect, it } from 'vitest'

import {
  hasContentManagerAuthority,
  requireContentManagerAdministrationAuthority,
} from './content-managers.js'

describe('Content Manager administration authority', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('allows $kind', (identity) => {
    expect(requireContentManagerAdministrationAuthority(identity)).toBe(
      identity.email,
    )
  })

  it.each([
    { kind: 'anonymous' as const },
    { email: 'member@example.com', kind: 'member' as const },
    { kind: 'denied' as const },
  ])('denies $kind', (identity) => {
    expect(() =>
      requireContentManagerAdministrationAuthority(identity),
    ).toThrow('Access denied')
  })
})

describe('Content Manager authority', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('is held implicitly by $kind', async (identity) => {
    await expect(hasContentManagerAuthority(identity)).resolves.toBe(true)
  })

  it.each([{ kind: 'anonymous' as const }, { kind: 'denied' as const }])(
    'is not held by $kind',
    async (identity) => {
      await expect(hasContentManagerAuthority(identity)).resolves.toBe(false)
    },
  )
})
