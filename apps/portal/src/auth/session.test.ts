import { describe, expect, it } from "vitest"

import { evaluateSession } from "./session"

const hour = 60 * 60 * 1000

describe("portal session", () => {
  it("keeps an active session and advances its idle deadline", () => {
    const now = new Date("2026-07-12T12:00:00.000Z")

    expect(
      evaluateSession(
        {
          absoluteExpiresAt: new Date(now.getTime() + 24 * hour),
          idleExpiresAt: new Date(now.getTime() + hour),
          revokedAt: null,
        },
        now,
      ),
    ).toEqual({
      active: true,
      nextIdleExpiresAt: new Date(now.getTime() + 12 * hour),
    })
  })

  it("rejects a session past its idle deadline", () => {
    const now = new Date("2026-07-12T12:00:00.000Z")

    expect(
      evaluateSession(
        {
          absoluteExpiresAt: new Date(now.getTime() + 24 * hour),
          idleExpiresAt: new Date(now.getTime() - 1),
          revokedAt: null,
        },
        now,
      ),
    ).toEqual({ active: false })
  })

  it("never advances the idle deadline beyond seven days", () => {
    const now = new Date("2026-07-12T12:00:00.000Z")
    const absoluteExpiresAt = new Date(now.getTime() + 2 * hour)

    expect(
      evaluateSession(
        {
          absoluteExpiresAt,
          idleExpiresAt: new Date(now.getTime() + hour),
          revokedAt: null,
        },
        now,
      ),
    ).toEqual({ active: true, nextIdleExpiresAt: absoluteExpiresAt })
  })

  it("rejects a locally logged-out session", () => {
    const now = new Date("2026-07-12T12:00:00.000Z")

    expect(
      evaluateSession(
        {
          absoluteExpiresAt: new Date(now.getTime() + 24 * hour),
          idleExpiresAt: new Date(now.getTime() + hour),
          revokedAt: now,
        },
        now,
      ),
    ).toEqual({ active: false })
  })
})
