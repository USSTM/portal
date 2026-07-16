import { describe, expect, it } from 'vitest'

import { authApp } from './app.js'

describe('auth liveness', () => {
  it('reports that the auth service is healthy', async () => {
    const response = await authApp.request('http://auth.test/health/live')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      service: 'auth',
      status: 'ok',
    })
  })
})
