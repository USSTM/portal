import { expect, it } from 'vitest'

import logout from '../../server/logout'

it('clears the portal session and returns to the requested local path', () => {
  const response = logout(
    new Request('http://portal.test/auth/logout?client=portal&returnTo=/', {
      method: 'POST',
    }),
  )

  expect(response.status).toBe(303)
  expect(response.headers.get('location')).toBe('/')
  expect(response.headers.get('set-cookie')).toContain(
    '__Host-portal-session=; Max-Age=0',
  )
})

it('rejects invalid logout requests', () => {
  expect(
    logout(new Request('http://portal.test/auth/logout?client=unknown', { method: 'POST' }))
      .status,
  ).toBe(400)
  expect(
    logout(new Request('http://portal.test/auth/logout?client=portal&returnTo=//evil.test', { method: 'POST' }))
      .status,
  ).toBe(400)
})
