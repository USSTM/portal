import { Hono } from "hono"

type ServiceDependencies = {
  authHandler: (request: Request) => Promise<Response>
  authServerMetadata?: (request: Request) => Promise<Response>
  authorizeAccessToken?: (
    token: string,
  ) => Promise<{ subject: string; email: string } | null>
  databaseIsReady: () => Promise<boolean>
}

export function createApp({
  authHandler,
  authServerMetadata,
  authorizeAccessToken = async () => null,
  databaseIsReady,
}: ServiceDependencies) {
  const app = new Hono()

  app.get("/health", async (context) => {
    if (await databaseIsReady()) {
      return context.json({ status: "ready" })
    }

    return context.json({ status: "unavailable" }, 503)
  })

  app.on(["GET", "POST"], "/api/auth/*", (context) =>
    authHandler(context.req.raw),
  )

  if (authServerMetadata) {
    app.get("/.well-known/oauth-authorization-server/api/auth", (context) =>
      authServerMetadata(context.req.raw),
    )
  }

  app.post("/internal/authorize", async (context) => {
    const authorization = context.req.header("authorization")
    if (!authorization?.startsWith("Bearer ")) {
      return context.json({ admitted: false }, 401)
    }
    const identity = await authorizeAccessToken(authorization.slice(7))
    if (!identity) return context.json({ admitted: false }, 403)
    return context.json({ admitted: true, identity })
  })

  app.get("/sign-in", (context) =>
    context.html(interactionPage("Sign in with Google", "sign-in")),
  )
  app.get("/consent", (context) =>
    context.html(interactionPage("Continue to USSTM Portal", "consent")),
  )
  app.get("/access-denied", (context) =>
    context.html(
      `<!doctype html><html><body><main><h1>Access not provisioned</h1><p>${escapeHtml(
        process.env.ACCESS_CONTACT_GUIDANCE ?? "Contact USSTM for access.",
      )}</p></main></body></html>`,
      403,
    ),
  )

  return app
}

function interactionPage(label: string, action: "sign-in" | "consent") {
  const endpoint =
    action === "sign-in"
      ? "/api/auth/sign-in/social"
      : "/api/auth/oauth2/consent"
  const body =
    action === "sign-in"
      ? `{ provider: "google", oauth_query: query }`
      : `{ accept: true, oauth_query: query }`
  return `<!doctype html><html><body><main><h1>USSTM Auth</h1><button id="continue">${label}</button></main><script>
  document.getElementById("continue").onclick = async () => {
    const query = location.search.slice(1)
    const response = await fetch("${endpoint}", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(${body}) })
    const result = await response.json()
    location.href = result.url || result.redirect_uri
  }
  </script></body></html>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
