import { expect, it } from 'vitest'

import { portalLogoutAction } from './logout'

it('targets the configured auth-service logout endpoint', () => {
  expect(portalLogoutAction).toBe('/auth/logout?client=portal&returnTo=/')
})
