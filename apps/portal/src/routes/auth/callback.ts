import { createFileRoute } from "@tanstack/react-router"

import { completeLogin } from "../../auth/callback"
import { finishAuthorization } from "../../auth/oidc"
import { consumeFlow, createPortalSession } from "../../auth/store"

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return completeLogin(request, {
          consumeFlow,
          finishAuthorization,
          createSession: createPortalSession,
          authorizeIdentity: async (accessToken) => {
            const authorization = await fetch(
              `${process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"}/internal/authorize`,
              {
                method: "POST",
                headers: { authorization: `Bearer ${accessToken}` },
              },
            )
            return authorization.ok
          },
        })
      },
    },
  },
})
