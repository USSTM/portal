import { serve } from '@hono/node-server'

import { authApp } from './app.js'

const port = Number(process.env.AUTH_PORT ?? 3001)

serve({ fetch: authApp.fetch, port })
