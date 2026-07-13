import { serve } from "@hono/node-server"
import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider"

import { createApp } from "./app.js"
import { auth } from "./auth.js"
import { authorizeAccessToken } from "./authorize.js"
import { databaseIsReady } from "./database.js"
import { migrate } from "./migrate.js"

const port = Number(process.env.PORT ?? 3001)
await migrate()
const app = createApp({
  authHandler: auth.handler,
  authServerMetadata: oauthProviderAuthServerMetadata(auth),
  authorizeAccessToken,
  databaseIsReady,
})

serve({ fetch: app.fetch, port }, ({ port: listeningPort }) => {
  console.log(`USSTM Auth listening on port ${listeningPort}`)
})
