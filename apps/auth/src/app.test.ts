import { describe, expect, it, vi } from "vitest"

import { createApp } from "./app.js"
import { localTestIdentityAuthorizer } from "./test/local-identity.js"

describe("auth service", () => {
  it("reports database readiness", async () => {
    const app = createApp({
      authHandler: vi.fn(),
      databaseIsReady: async () => true,
    })

    const response = await app.request("/health")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: "ready" })
  })

  it("reports an unavailable database", async () => {
    const app = createApp({
      authHandler: vi.fn(),
      databaseIsReady: async () => false,
    })

    const response = await app.request("/health")

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ status: "unavailable" })
  })

  it("delegates auth routes to Better Auth", async () => {
    const authHandler = vi.fn(async () => Response.json({ delegated: true }))
    const app = createApp({
      authHandler,
      databaseIsReady: async () => true,
    })

    const response = await app.request("/api/auth/get-session")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ delegated: true })
    expect(authHandler).toHaveBeenCalledOnce()
  })

  it("admits a currently provisioned bearer token", async () => {
    const authorizeAccessToken = localTestIdentityAuthorizer([
      {
        email: "member@example.ca",
        provisioned: true,
        subject: "member-1",
        token: "valid-token",
      },
    ])
    const app = createApp({
      authHandler: vi.fn(),
      authorizeAccessToken,
      databaseIsReady: async () => true,
    })

    const response = await app.request("/internal/authorize", {
      method: "POST",
      headers: { authorization: "Bearer valid-token" },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      admitted: true,
      identity: { subject: "member-1", email: "member@example.ca" },
    })
  })

  it("fails closed when current provisioning is denied", async () => {
    const authorizeAccessToken = localTestIdentityAuthorizer([
      {
        email: "visitor@example.ca",
        provisioned: false,
        subject: "visitor-1",
        token: "unprovisioned-token",
      },
    ])
    const app = createApp({
      authHandler: vi.fn(),
      authorizeAccessToken,
      databaseIsReady: async () => true,
    })

    const response = await app.request("/internal/authorize", {
      method: "POST",
      headers: { authorization: "Bearer unprovisioned-token" },
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ admitted: false })
  })

  it("applies provisioning revocation on the next authorization check", async () => {
    const testIdentity = {
      email: "administrator@example.ca",
      provisioned: true,
      subject: "administrator-1",
      token: "session-token",
    }
    const app = createApp({
      authHandler: vi.fn(),
      authorizeAccessToken: localTestIdentityAuthorizer([testIdentity]),
      databaseIsReady: async () => true,
    })
    const authorize = () =>
      app.request("/internal/authorize", {
        method: "POST",
        headers: { authorization: "Bearer session-token" },
      })

    expect((await authorize()).status).toBe(200)
    testIdentity.provisioned = false
    expect((await authorize()).status).toBe(403)
  })
})
