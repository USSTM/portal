import { describe, expect, it } from 'vitest'

import { getLiveness, getReadiness } from './health'

describe('portal health', () => {
  it('reports liveness without a database connection', () => {
    expect(getLiveness()).toEqual({ service: 'portal', status: 'ok' })
  })

  it('reports ready when the database is reachable', async () => {
    await expect(getReadiness(async () => undefined)).resolves.toEqual({
      service: 'portal',
      status: 'ok',
    })
  })

  it('reports unavailable when the database is unreachable', async () => {
    await expect(
      getReadiness(async () => Promise.reject(new Error('unreachable'))),
    ).resolves.toEqual({ service: 'portal', status: 'unavailable' })
  })
})
