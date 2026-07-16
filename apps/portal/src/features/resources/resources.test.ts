import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import {
  requireResourceAdministrationAuthority,
  requireResourceBrowseAuthority,
} from './resources'

describe('Resource authority', () => {
  it('allows every admitted identity to browse Resources', () => {
    expect(
      requireResourceBrowseAuthority({
        email: 'member@example.com',
        kind: 'member',
      }),
    ).toBe('member@example.com')
    expect(
      requireResourceBrowseAuthority({
        email: 'root@example.com',
        kind: 'superuser',
      }),
    ).toBe('root@example.com')
    expect(() => requireResourceBrowseAuthority({ kind: 'denied' })).toThrow(
      'Access denied',
    )
    expect(() => requireResourceBrowseAuthority({ kind: 'anonymous' })).toThrow(
      'Access denied',
    )
  })

  it('limits Resource administration to Administrators and the Superuser', () => {
    expect(
      requireResourceAdministrationAuthority({
        email: 'admin@example.com',
        kind: 'administrator',
      }),
    ).toBe('admin@example.com')
    expect(() =>
      requireResourceAdministrationAuthority({
        email: 'member@example.com',
        kind: 'member',
      }),
    ).toThrow('Access denied')
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
