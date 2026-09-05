import { describe, expect, it } from 'vitest'

import { requireBookingAdministrator } from './calendar-actions.js'

describe('Booking administrator authority', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('allows $kind', (identity) => {
    expect(requireBookingAdministrator(identity)).toBe(identity.email)
  })

  it.each([
    { kind: 'anonymous' as const },
    { email: 'member@example.com', kind: 'member' as const },
    { kind: 'denied' as const },
  ])('denies $kind', (identity) => {
    expect(() => requireBookingAdministrator(identity)).toThrow(
      'Administrator authority is required',
    )
  })
})
