import { describe, expect, it } from 'vitest'

import {
  browseAuditHistory,
  requireAuditHistoryAuthority,
} from './audit-history.js'

describe('Audit History authority', () => {
  it.each([
    { email: 'superuser@example.com', kind: 'superuser' as const },
    { email: 'admin@example.com', kind: 'administrator' as const },
  ])('allows $kind', (identity) => {
    expect(requireAuditHistoryAuthority(identity)).toBe(identity.email)
  })

  it.each([
    { kind: 'anonymous' as const },
    { email: 'member@example.com', kind: 'member' as const },
    { kind: 'denied' as const },
  ])('denies $kind', (identity) => {
    expect(() => requireAuditHistoryAuthority(identity)).toThrow(
      'Access denied',
    )
  })

  it('rejects invalid pagination before querying Audit Entries', async () => {
    await expect(browseAuditHistory({ page: 0, pageSize: 25 })).rejects.toThrow(
      'Invalid Audit History page',
    )
  })
})
