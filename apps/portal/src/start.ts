import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

import { trustedRequestOrigin } from './security/request-origin'

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === 'serverFn',
  origin: (origin, context) => origin === trustedRequestOrigin(context.request),
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}))
