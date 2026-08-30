import { afterEach, describe, expect, it } from 'vitest'

import { hasTrustedOrigin, trustedRequestOrigin } from './request-origin'

afterEach(() => delete process.env.PORTAL_TRUST_PROXY)

describe('trusted request Origin', () => {
  it('uses the direct request URL unless the deployment explicitly trusts its proxy', () => {
    const request = proxiedRequest('https://evil.example')

    expect(trustedRequestOrigin(request)).toBe('http://portal:3000')
    expect(hasTrustedOrigin(request)).toBe(false)
  })

  it('uses proxy-overwritten forwarding headers in production', () => {
    process.env.PORTAL_TRUST_PROXY = 'true'

    expect(hasTrustedOrigin(proxiedRequest('https://localhost'))).toBe(true)
    expect(hasTrustedOrigin(proxiedRequest('https://evil.example'))).toBe(false)
  })
})

function proxiedRequest(origin: string) {
  return new Request('http://portal:3000/_serverFn/test', {
    headers: {
      origin,
      'x-forwarded-host': 'localhost',
      'x-forwarded-proto': 'https',
    },
    method: 'POST',
  })
}
