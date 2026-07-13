import { auth } from "./auth.js"
import { decideAdmission } from "./admission.js"
import { getAdmissionFacts, getIdentity } from "./database.js"

export async function authorizeAccessToken(token: string) {
  const clientId = process.env.PORTAL_OAUTH_CLIENT_ID
  const clientSecret = process.env.PORTAL_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  let introspection
  try {
    introspection = await auth.api.oauth2Introspect({
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        token,
        token_type_hint: "access_token",
      },
    })
  } catch {
    return null
  }
  const subject =
    typeof introspection.sub === "string" ? introspection.sub : null
  if (!introspection.active || !subject) return null
  if (!decideAdmission(await getAdmissionFacts(subject)).admitted) return null

  const identity = await getIdentity(subject)
  return identity ? { subject, email: identity.email } : null
}
