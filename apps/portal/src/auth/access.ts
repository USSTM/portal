import { refreshAccessToken } from "./oidc"
import { readActiveSession, updateTokens } from "./store"

export async function getAuthorizedSession(id: string, now = new Date()) {
  const session = await readActiveSession(id, now)
  if (!session) return null
  try {
    if (session.accessTokenExpiresAt <= now) {
      if (!session.refreshToken) return null
      const refreshed = await refreshAccessToken(session.refreshToken)
      session.accessToken = refreshed.accessToken
      session.accessTokenExpiresAt = refreshed.accessTokenExpiresAt
      session.refreshToken = refreshed.refreshToken ?? session.refreshToken
      await updateTokens(
        session.id,
        session.accessToken,
        session.refreshToken,
        session.accessTokenExpiresAt,
      )
    }
    const response = await fetch(
      `${process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"}/internal/authorize`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${session.accessToken}` },
      },
    )
    return response.ok ? session : null
  } catch {
    return null
  }
}
