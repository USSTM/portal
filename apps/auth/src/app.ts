import { Hono } from 'hono'

export const authApp = new Hono().get('/health/live', (context) => {
  return context.json({ service: 'auth', status: 'ok' })
})
