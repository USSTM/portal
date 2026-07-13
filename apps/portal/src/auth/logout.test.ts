import { describe, expect, it, vi } from "vitest"

import { logoutCurrentPortalSession } from "./logout"

describe("portal logout", () => {
  it("revokes only the current local session and its portal tokens", async () => {
    const revokeSession = vi.fn(async () => ({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    }))
    const revokeTokens = vi.fn(async () => undefined)

    await logoutCurrentPortalSession("current-session", {
      revokeSession,
      revokeTokens,
    })

    expect(revokeSession).toHaveBeenCalledWith("current-session")
    expect(revokeTokens).toHaveBeenCalledWith("access-token", "refresh-token")
  })

  it("keeps local logout successful while the auth service is unavailable", async () => {
    await expect(
      logoutCurrentPortalSession("current-session", {
        revokeSession: async () => ({ accessToken: "access-token" }),
        revokeTokens: async () => {
          throw new Error("auth unavailable")
        },
      }),
    ).resolves.toBeUndefined()
  })
})
