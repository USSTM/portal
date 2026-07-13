import { describe, expect, it, vi } from "vitest"

import { completeLogin } from "./callback"
import { flowCookieName } from "./cookies"

const identity = {
  accessToken: "test-access-token",
  accessTokenExpiresAt: new Date("2026-07-12T13:00:00.000Z"),
  email: "administrator@example.ca",
  refreshToken: "test-refresh-token",
  subject: "google-subject-1",
}

function request() {
  return new Request(
    "http://localhost:3000/auth/callback?code=code&state=state",
    {
      headers: { cookie: `${flowCookieName}=flow-1` },
    },
  )
}

describe("portal OIDC callback", () => {
  it("creates a portal session for a provisioned local test identity", async () => {
    const response = await completeLogin(request(), {
      authorizeIdentity: async () => true,
      consumeFlow: async () => ({ codeVerifier: "verifier", state: "state" }),
      createSession: async () => "portal-session-1",
      finishAuthorization: async () => identity,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/account",
    )
    expect(response.headers.getSetCookie().join(";")).toContain(
      "__Host-usstm_portal_session=portal-session-1",
    )
  })

  it("denies an unprovisioned local test identity", async () => {
    const response = await completeLogin(request(), {
      authorizeIdentity: async () => false,
      consumeFlow: async () => ({ codeVerifier: "verifier", state: "state" }),
      createSession: vi.fn(),
      finishAuthorization: async () => identity,
    })

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/access-denied",
    )
  })

  it("denies an expired flow or invalid state", async () => {
    const response = await completeLogin(request(), {
      authorizeIdentity: vi.fn(),
      consumeFlow: async () => null,
      createSession: vi.fn(),
      finishAuthorization: vi.fn(),
    })

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/access-denied",
    )
  })

  it("denies PKCE or auth-service failures without exposing an error", async () => {
    const response = await completeLogin(request(), {
      authorizeIdentity: vi.fn(),
      consumeFlow: async () => ({ codeVerifier: "wrong", state: "state" }),
      createSession: vi.fn(),
      finishAuthorization: async () => {
        throw new Error("PKCE validation failed")
      },
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/access-denied",
    )
  })
})
