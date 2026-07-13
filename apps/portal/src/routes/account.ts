import { createFileRoute } from "@tanstack/react-router"

import { getAuthorizedSession } from "../auth/access"
import { clearCookie, readCookie, sessionCookieName } from "../auth/cookies"

export const Route = createFileRoute("/account")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sessionId = readCookie(request, sessionCookieName)
        const session = sessionId ? await getAuthorizedSession(sessionId) : null
        if (!session) {
          return new Response(null, {
            status: 302,
            headers: {
              location: new URL("/auth/login", request.url).href,
              "set-cookie": clearCookie(sessionCookieName),
            },
          })
        }
        return new Response(
          `<!doctype html><html><body><main><h1>USSTM Portal</h1><p>Signed in as ${escapeHtml(session.email)}</p><form method="post" action="/auth/logout"><button>Sign out</button></form></main></body></html>`,
          { headers: { "content-type": "text/html; charset=utf-8" } },
        )
      },
    },
  },
})

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
