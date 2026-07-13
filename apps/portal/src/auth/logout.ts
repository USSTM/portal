type LogoutTokens = { accessToken: string; refreshToken?: string } | null

type LogoutDependencies = {
  revokeSession: (id: string) => Promise<LogoutTokens>
  revokeTokens: (accessToken: string, refreshToken?: string) => Promise<void>
}

export async function logoutCurrentPortalSession(
  sessionId: string,
  dependencies: LogoutDependencies,
) {
  const tokens = await dependencies.revokeSession(sessionId)
  if (!tokens) return
  try {
    await dependencies.revokeTokens(tokens.accessToken, tokens.refreshToken)
  } catch {
    // Local logout succeeds even if the auth service is unavailable.
  }
}
