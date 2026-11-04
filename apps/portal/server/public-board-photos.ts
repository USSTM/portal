import { readPublicBoardPhoto } from '../src/features/board/public-board.js'
import { isImageId } from '../src/storage/images.js'

// Photo IDs are random and never reused. A short cache keeps a photo from
// lingering long after its Member leaves the board, since the photo is public
// only while they are a Board Member.
const cacheControl = 'public, max-age=300'

export function createPublicBoardPhotoHandler(dependencies: {
  readPhoto: typeof readPublicBoardPhoto
}) {
  return async function publicBoardPhoto(request: Request) {
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
    })
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      headers.set('Allow', 'GET, HEAD')
      return new Response(null, { headers, status: 405 })
    }

    const photoId = new URL(request.url).pathname.split('/').at(-1) ?? ''
    const photo = isImageId(photoId)
      ? await dependencies.readPhoto(photoId)
      : undefined
    if (!photo) {
      headers.set('Cache-Control', 'no-store')
      return new Response(null, { headers, status: 404 })
    }

    headers.set('Content-Type', photo.contentType)
    headers.set('Content-Length', String(photo.body.byteLength))
    return new Response(request.method === 'HEAD' ? null : photo.body.slice(), {
      headers,
    })
  }
}

export default createPublicBoardPhotoHandler({
  readPhoto: readPublicBoardPhoto,
})
