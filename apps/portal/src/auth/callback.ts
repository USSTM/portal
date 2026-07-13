import {
  clearCookie,
  cookie,
  flowCookieName,
  readCookie,
  sessionCookieName,
} from "./cookies"

type CompletedIdentity = {
  accessToken: string
  accessTokenExpiresAt: Date
  email: string
  refreshToken?: string
  subject: string
}

type CallbackDependencies = {
  consumeFlow: (
    id: string,
  ) => Promise<{ codeVerifier: string; state: string } | null>
  finishAuthorization: (
    url: URL,
    codeVerifier: string,
    state: string,
  ) => Promise<CompletedIdentity>
  authorizeIdentity: (accessToken: string) => Promise<boolean>
  createSession: (identity: CompletedIdentity) => Promise<string>
}

export async function completeLogin(
  request: Request,
  dependencies: CallbackDependencies,
) {
  try {
    const flowId = readCookie(request, flowCookieName)
    const flow = flowId ? await dependencies.consumeFlow(flowId) : null
    if (!flow) return denied(request)

    const identity = await dependencies.finishAuthorization(
      new URL(request.url),
      flow.codeVerifier,
      flow.state,
    )
    if (!(await dependencies.authorizeIdentity(identity.accessToken))) {
      return denied(request)
    }

    const sessionId = await dependencies.createSession(identity)
    const headers = new Headers({
      location: new URL("/account", request.url).href,
    })
    headers.append("set-cookie", clearCookie(flowCookieName))
    headers.append(
      "set-cookie",
      cookie(sessionCookieName, sessionId, 7 * 24 * 60 * 60),
    )
    return new Response(null, { status: 302, headers })
  } catch {
    return denied(request)
  }
}

function denied(request: Request) {
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL("/access-denied", request.url).href,
      "set-cookie": clearCookie(flowCookieName),
    },
  })
}
