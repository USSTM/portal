import { createFileRoute } from "@tanstack/react-router"

import { clearCookie, readCookie, sessionCookieName } from "../../auth/cookies"
import { revokePortalSession } from "../../auth/store"
import { revokeOAuthTokens } from "../../auth/oidc"
import { logoutCurrentPortalSession } from "../../auth/logout"

export const Route = createFileRoute("/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sessionId = readCookie(request, sessionCookieName)
        if (sessionId) {
          await logoutCurrentPortalSession(sessionId, {
            revokeSession: revokePortalSession,
            revokeTokens: revokeOAuthTokens,
          })
        }
        return new Response(null, {
          status: 303,
          headers: {
            location: new URL("/", request.url).href,
            "set-cookie": clearCookie(sessionCookieName),
          },
        })
      },
    },
  },
})
