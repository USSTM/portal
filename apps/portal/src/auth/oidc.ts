import * as client from "openid-client"

let configuration: client.Configuration | undefined

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function config() {
  const issuer = process.env.AUTH_ISSUER ?? "http://localhost:3001/api/auth"
  const service = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"
  const secret = required("PORTAL_OAUTH_CLIENT_SECRET")
  if (!configuration) {
    configuration = new client.Configuration(
      {
        issuer,
        authorization_endpoint: `${issuer}/oauth2/authorize`,
        token_endpoint: `${service}/api/auth/oauth2/token`,
        revocation_endpoint: `${service}/api/auth/oauth2/revoke`,
        userinfo_endpoint: `${service}/api/auth/oauth2/userinfo`,
        jwks_uri: `${service}/api/auth/jwks`,
      },
      required("PORTAL_OAUTH_CLIENT_ID"),
      {
        client_secret: secret,
        token_endpoint_auth_method: "client_secret_post",
      },
      client.ClientSecretPost(secret),
    )
    if (!issuer.startsWith("https://")) {
      client.allowInsecureRequests(configuration)
    }
  }
  return configuration
}

export async function beginAuthorization() {
  const oidc = config()
  const codeVerifier = client.randomPKCECodeVerifier()
  const state = client.randomState()
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
  const url = client.buildAuthorizationUrl(oidc, {
    redirect_uri:
      process.env.PORTAL_OAUTH_REDIRECT_URI ??
      "http://localhost:3000/auth/callback",
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  })
  return { codeVerifier, state, url }
}

export async function finishAuthorization(
  callbackUrl: URL,
  codeVerifier: string,
  state: string,
) {
  const tokens = await client.authorizationCodeGrant(config(), callbackUrl, {
    expectedState: state,
    pkceCodeVerifier: codeVerifier,
  })
  const claims = tokens.claims()
  if (!claims?.sub || typeof claims.email !== "string")
    throw new Error("OIDC response did not contain a subject and email")
  return {
    accessToken: tokens.access_token,
    accessTokenExpiresAt: new Date(
      Date.now() + (tokens.expiresIn() ?? 3600) * 1000,
    ),
    email: claims.email,
    refreshToken: tokens.refresh_token,
    subject: claims.sub,
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const tokens = await client.refreshTokenGrant(config(), refreshToken)
  return {
    accessToken: tokens.access_token,
    accessTokenExpiresAt: new Date(
      Date.now() + (tokens.expiresIn() ?? 3600) * 1000,
    ),
    refreshToken: tokens.refresh_token,
  }
}

export async function revokeOAuthTokens(
  accessToken: string,
  refreshToken?: string,
) {
  await client.tokenRevocation(config(), accessToken, {
    token_type_hint: "access_token",
  })
  if (refreshToken) {
    await client.tokenRevocation(config(), refreshToken, {
      token_type_hint: "refresh_token",
    })
  }
}
