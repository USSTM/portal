import { describe, expect, it } from "vitest"

import { cookie, sessionCookieName } from "./cookies"

describe("portal session cookie", () => {
  it("is host-only, secure, HTTP-only, and same-site", () => {
    const value = cookie(sessionCookieName, "opaque-session", 60)

    expect(value).toContain("__Host-usstm_portal_session=opaque-session")
    expect(value).toContain("Path=/")
    expect(value).toContain("HttpOnly")
    expect(value).toContain("SameSite=Lax")
    expect(value).toContain("Secure")
    expect(value).not.toContain("Domain=")
  })
})
