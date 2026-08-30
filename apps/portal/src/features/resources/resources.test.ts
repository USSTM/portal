import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import {
  requireResourceAdministrationAuthority,
  requireResourceBrowseAuthority,
} from './resources'

describe('Resource authority', () => {
  it.each([
    { email: 'member@example.com', kind: 'member' as const },
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'root@example.com', kind: 'superuser' as const },
  ])('allows $kind to browse Resources', (identity) => {
    expect(requireResourceBrowseAuthority(identity)).toBe(identity.email)
  })

  it.each([{ kind: 'anonymous' as const }, { kind: 'denied' as const }])(
    'denies $kind from browsing Resources',
    (identity) => {
      expect(() => requireResourceBrowseAuthority(identity)).toThrow(
        'Access denied',
      )
    },
  )

  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('allows $kind to administer Resources', (identity) => {
    expect(requireResourceAdministrationAuthority(identity)).toBe(
      identity.email,
    )
  })

  it.each([
    { kind: 'anonymous' as const },
    { email: 'member@example.com', kind: 'member' as const },
    { kind: 'denied' as const },
  ])('denies $kind from administering Resources', (identity) => {
    expect(() => requireResourceAdministrationAuthority(identity)).toThrow(
      'Access denied',
    )
  })
})

describe('Resource seed migration', () => {
  it('preserves the five Finance and four Operations legacy links', () => {
    const migration = readFileSync(
      new URL('../../../drizzle/0008_brave_avengers.sql', import.meta.url),
      'utf8',
    )

    expect(migration.match(/^\s+\('finance',/gm)).toHaveLength(5)
    expect(migration.match(/^\s+\('operations',/gm)).toHaveLength(4)
    expect(migration).toContain('Budget Request Template')
    expect(migration).toContain('Graphics Request Form')
  })
})
