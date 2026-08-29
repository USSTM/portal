import { defineNitroPlugin } from 'nitro/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('response', (response, event) => {
    console.log(
      JSON.stringify({
        level: 'info',
        method: event.req.method,
        path: new URL(event.req.url).pathname,
        requestId: event.req.headers.get('x-request-id') ?? crypto.randomUUID(),
        service: 'portal',
        status: response.status,
        timestamp: new Date().toISOString(),
      }),
    )
  })
})
