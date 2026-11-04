import { defineNitroPlugin } from 'nitro/runtime'
import type { NitroRuntimeHooks } from 'nitro/types'

type ResponseHook = NitroRuntimeHooks['response']

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook(
    'response',
    (
      response: Parameters<ResponseHook>[0],
      event: Parameters<ResponseHook>[1],
    ) => {
      console.log(
        JSON.stringify({
          level: 'info',
          method: event.req.method,
          path: new URL(event.req.url).pathname,
          requestId:
            event.req.headers.get('x-request-id') ?? crypto.randomUUID(),
          service: 'portal',
          status: response.status,
          timestamp: new Date().toISOString(),
        }),
      )
    },
  )
})
