// Development only. In production Caddy routes /auth/* to the auth service
// before requests reach Next, so this never runs there. In development it
// forwards /auth/* to the local auth service itself, because Next's rewrite
// proxy does not pass this site's host on, and the auth service needs it
// (X-Forwarded-Host, with AUTH_TRUST_PROXY=true) to tell which client is
// signing in.
const dropRequestHeaders = ['connection', 'content-length', 'host']
const dropResponseHeaders = ['content-encoding', 'content-length', 'set-cookie']

async function forwardToAuthService(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 404 })
  }

  const url = new URL(request.url)
  const headers = new Headers(request.headers)
  for (const name of dropRequestHeaders) headers.delete(name)
  headers.set('x-forwarded-host', url.host)
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''))

  const response = await fetch(
    new URL(
      `${url.pathname}${url.search}`,
      `http://127.0.0.1:${process.env.AUTH_PORT ?? '3001'}`,
    ),
    {
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.arrayBuffer(),
      headers,
      method: request.method,
      redirect: 'manual',
    },
  )

  const responseHeaders = new Headers()
  response.headers.forEach((value, name) => {
    if (!dropResponseHeaders.includes(name)) responseHeaders.set(name, value)
  })
  for (const cookie of response.headers.getSetCookie()) {
    responseHeaders.append('set-cookie', cookie)
  }
  return new Response(response.body, {
    headers: responseHeaders,
    status: response.status,
  })
}

export const GET = forwardToAuthService
export const POST = forwardToAuthService
