import { betterAuth } from "better-auth"
import { oauthProvider } from "@better-auth/oauth-provider"
import { jwt } from "better-auth/plugins"

import { pool } from "./database.js"
import { decideAdmission } from "./admission.js"
import { bindUSSTMAdministrator, getAdmissionFacts } from "./database.js"

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001"
const portalClientId = process.env.PORTAL_OAUTH_CLIENT_ID

export const auth = betterAuth({
  appName: "USSTM Auth",
  baseURL,
  database: pool,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => bindUSSTMAdministrator(user.email, user.id),
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.PORTAL_URL ?? "http://localhost:3000"],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "local-google-client-id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ?? "local-google-client-secret",
      scope: ["openid", "email", "profile"],
    },
  },
  plugins: [
    jwt(),
    oauthProvider({
      allowDynamicClientRegistration: false,
      allowUnauthenticatedClientRegistration: false,
      cachedTrustedClients: portalClientId
        ? new Set([portalClientId])
        : undefined,
      consentPage: "/consent",
      loginPage: "/sign-in",
      postLogin: {
        page: "/access-denied",
        consentReferenceId: () => undefined,
        shouldRedirect: async ({ user }) => {
          await bindUSSTMAdministrator(user.email, user.id)
          return !decideAdmission(await getAdmissionFacts(user.id)).admitted
        },
      },
      scopes: ["openid", "email", "profile", "offline_access"],
      silenceWarnings: { oauthAuthServerConfig: true },
    }),
  ],
})
