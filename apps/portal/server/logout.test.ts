import { expect, it } from 'vitest'

import logout from './logout'

it('clears the portal session and returns to the requested local path', () => {
  const response = logout(
    new Request('http://portal.test/auth/logout?client=portal&returnTo=/', {
      headers: { origin: 'http://portal.test' },
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
    logout(
      new Request('http://portal.test/auth/logout?client=unknown', {
        method: 'POST',
      }),
    ).status,
  ).toBe(400)
  expect(
    logout(
      new Request(
        'http://portal.test/auth/logout?client=portal&returnTo=//evil.test',
        { method: 'POST' },
      ),
    ).status,
  ).toBe(400)
})

it('rejects logout from another Origin without clearing the session', () => {
  const response = logout(
    new Request('https://portal.example/auth/logout?client=portal', {
      headers: { origin: 'https://evil.example' },
      method: 'POST',
    }),
  )

  expect(response.status).toBe(400)
  expect(response.headers.get('set-cookie')).toBeNull()
})
