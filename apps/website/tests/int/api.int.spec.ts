import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches Content Managers', async () => {
    const contentManagers = await payload.find({
      collection: 'content-managers',
    })
    expect(contentManagers).toBeDefined()
  })

  it('does not let anyone create a Content Manager through the API', async () => {
    await expect(
      payload.create({
        collection: 'content-managers',
        data: { email: `editor-${crypto.randomUUID()}@example.com` },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
