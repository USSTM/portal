import { describe, expect, it } from 'vitest'

import { browseAuditHistory, requireAuditHistoryAuthority } from './audit-history.js'

describe('Audit History authority', () => {
  it('allows the Superuser and Administrators', () => {
    expect(
      requireAuditHistoryAuthority({
        email: 'superuser@example.com',
        kind: 'superuser',
      }),
    ).toBe('superuser@example.com')
    expect(
      requireAuditHistoryAuthority({
        email: 'admin@example.com',
        kind: 'administrator',
      }),
    ).toBe('admin@example.com')
  })

  it('denies anonymous and non-administrator Members', () => {
    expect(() => requireAuditHistoryAuthority({ kind: 'denied' })).toThrow(
      'Access denied',
    )
  })

  it('rejects invalid pagination before querying Audit Entries', async () => {
    await expect(
      browseAuditHistory({ page: 0, pageSize: 25 }),
    ).rejects.toThrow('Invalid Audit History page')
  })
})
