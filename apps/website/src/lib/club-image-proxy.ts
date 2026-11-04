import { isPortalImageId } from './portal-images'

const passThroughHeaders = ['cache-control', 'content-length', 'content-type']

/**
 * Proxies a public portal image route, such as /api/v1/club-images, so images
 * stay same-origin under the Website CSP. The portal decides whether an image
 * is still public; this only passes its answer on.
 */
export function createPortalImageProxy({
  portalPath,
  baseUrl = process.env.PORTAL_PUBLIC_URL,
  fetchImpl = fetch,
}: {
  portalPath: '/api/v1/club-images' | '/api/v1/board-photos'
  baseUrl?: string
  fetchImpl?: typeof fetch
}) {
  return async function GET(
    _request: Request,
    { params }: { params: Promise<{ imageId: string }> },
  ) {
    const { imageId } = await params
    if (!baseUrl || !isPortalImageId(imageId)) return notFound()

    try {
      const response = await fetchImpl(
        new URL(`${portalPath}/${imageId}`, baseUrl),
        { cache: 'no-store' },
      )
      if (!response.ok || !response.body) return notFound()
      const headers = new Headers()
      for (const name of passThroughHeaders) {
        const value = response.headers.get(name)
        if (value) headers.set(name, value)
      }
      return new Response(response.body, { headers })
    } catch (error) {
      console.error('Portal image request failed', error)
      return notFound()
    }
  }
}

export function createClubImageProxy(
  options: { baseUrl?: string; fetchImpl?: typeof fetch } = {},
) {
  return createPortalImageProxy({
    ...options,
    portalPath: '/api/v1/club-images',
  })
}

function notFound() {
  return new Response(null, {
    headers: { 'cache-control': 'no-store' },
    status: 404,
  })
}
