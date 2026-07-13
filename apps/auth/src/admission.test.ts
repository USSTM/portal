import { describe, expect, it } from "vitest"

import { decideAdmission } from "./admission.js"

describe("portal admission", () => {
  it("admits a provisioned identity with a verified email", () => {
    expect(
      decideAdmission({
        emailVerified: true,
        isUSSTMAdministrator: true,
      }),
    ).toEqual({ admitted: true })
  })

  it("rejects an unprovisioned identity without exposing policy details", () => {
    expect(
      decideAdmission({
        emailVerified: true,
        isUSSTMAdministrator: false,
      }),
    ).toEqual({ admitted: false, reason: "access_not_provisioned" })
  })

  it("rejects an identity whose email is not verified", () => {
    expect(
      decideAdmission({
        emailVerified: false,
        isUSSTMAdministrator: true,
      }),
    ).toEqual({ admitted: false, reason: "access_not_provisioned" })
  })
})
