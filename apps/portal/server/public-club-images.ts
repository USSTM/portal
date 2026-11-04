import { readPublicClubImage } from '../src/features/clubs/club-profiles.js'
import { isImageId } from '../src/storage/images.js'

// Image IDs are random and never reused, so a day of public caching is safe.
// An archived Club's image stops being served once caches expire.
const cacheControl = 'public, max-age=86400'

export function createPublicClubImageHandler(dependencies: {
  readImage: typeof readPublicClubImage
}) {
  return async function publicClubImage(request: Request) {
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
    })
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      headers.set('Allow', 'GET, HEAD')
      return new Response(null, { headers, status: 405 })
    }

    const imageId = new URL(request.url).pathname.split('/').at(-1) ?? ''
    const image = isImageId(imageId)
      ? await dependencies.readImage(imageId)
      : undefined
    if (!image) {
      headers.set('Cache-Control', 'no-store')
      return new Response(null, { headers, status: 404 })
    }

    headers.set('Content-Type', image.contentType)
    headers.set('Content-Length', String(image.body.byteLength))
    return new Response(request.method === 'HEAD' ? null : image.body.slice(), {
      headers,
    })
  }
}

export default createPublicClubImageHandler({ readImage: readPublicClubImage })
