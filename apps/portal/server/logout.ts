export default function logout(request: Request) {
  const url = new URL(request.url)
  const returnTo = url.searchParams.get('returnTo')
  if (
    request.method !== 'POST' ||
    url.searchParams.get('client') !== 'portal' ||
    (returnTo !== null && !isRelativePath(returnTo))
  ) {
    return new Response('Invalid logout request', { status: 400 })
  }

  const headers = new Headers({
    'Set-Cookie':
      '__Host-portal-session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax',
  })
  if (returnTo === null) return new Response(null, { headers, status: 204 })
  headers.set('Location', returnTo)
  return new Response(null, { headers, status: 303 })
}

function isRelativePath(value: string) {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
}
