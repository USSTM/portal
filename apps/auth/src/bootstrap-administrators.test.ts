import { describe, expect, it } from "vitest"

import { parseUSSTMAdministratorEmails } from "./bootstrap-input.js"

describe("USSTM Administrator bootstrap", () => {
  it("normalizes exactly three distinct email addresses", () => {
    expect(
      parseUSSTMAdministratorEmails([
        " ONE@example.ca ",
        "two@example.ca",
        "THREE@example.ca",
      ]),
    ).toEqual(["one@example.ca", "two@example.ca", "three@example.ca"])
  })

  it("rejects repeat execution input that is not three distinct addresses", () => {
    expect(() =>
      parseUSSTMAdministratorEmails([
        "one@example.ca",
        "ONE@example.ca",
        "two@example.ca",
      ]),
    ).toThrow("exactly three distinct")
  })
})
