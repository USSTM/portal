type LocalTestIdentity = {
  token: string
  subject: string
  email: string
  provisioned: boolean
}

export function localTestIdentityAuthorizer(identities: LocalTestIdentity[]) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Local test identities are available only under the test runner",
    )
  }
  return async (token: string) => {
    const identity = identities.find((candidate) => candidate.token === token)
    if (!identity?.provisioned) return null
    return { subject: identity.subject, email: identity.email }
  }
}
