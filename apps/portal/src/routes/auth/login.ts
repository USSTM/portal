import { createFileRoute } from "@tanstack/react-router"

import { beginAuthorization } from "../../auth/oidc"
import { cookie, flowCookieName } from "../../auth/cookies"
import { createFlow } from "../../auth/store"

export const Route = createFileRoute("/auth/login")({
  server: {
    handlers: {
      GET: async () => {
        const authorization = await beginAuthorization()
        const flowId = await createFlow(
          authorization.state,
          authorization.codeVerifier,
        )
        return new Response(null, {
          status: 302,
          headers: {
            location: authorization.url.href,
            "set-cookie": cookie(flowCookieName, flowId, 10 * 60),
          },
        })
      },
    },
  },
})
