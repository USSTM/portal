export function trustedRequestOrigin(request: Request) {
  if (process.env.PORTAL_TRUST_PROXY === 'true') {
    const host = request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto')
    if (host && (protocol === 'http' || protocol === 'https')) {
      try {
        return new URL(`${protocol}://${host}`).origin
      } catch {
        return undefined
      }
    }
  }

  return new URL(request.url).origin
}

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return origin !== null && origin === trustedRequestOrigin(request)
}
