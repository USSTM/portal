import { listPublicBoardArchives } from '../src/features/board/board-archives.js'

// Follows the Events API conventions (ADR-0005, docs/api/board-archives.md).
const cacheControl = 'public, max-age=60'

export function createPublicBoardArchivesHandler(dependencies: {
  listArchives: typeof listPublicBoardArchives
}) {
  return async function publicBoardArchives(request: Request) {
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
    })
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      headers.set('Allow', 'GET, HEAD')
      return new Response(null, { headers, status: 405 })
    }
    if (request.method === 'HEAD') return new Response(null, { headers })
    return Response.json(await dependencies.listArchives(), { headers })
  }
}

export default createPublicBoardArchivesHandler({
  listArchives: listPublicBoardArchives,
})
