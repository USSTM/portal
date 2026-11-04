import { listPublicBoard } from '../src/features/board/public-board.js'

// Follows the Events API conventions (ADR-0005, docs/api/board.md).
const cacheControl = 'public, max-age=60'

export function createPublicBoardHandler(dependencies: {
  listBoard: typeof listPublicBoard
}) {
  return async function publicBoard(request: Request) {
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
    })
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      headers.set('Allow', 'GET, HEAD')
      return new Response(null, { headers, status: 405 })
    }
    if (request.method === 'HEAD') return new Response(null, { headers })
    return Response.json(await dependencies.listBoard(), { headers })
  }
}

export default createPublicBoardHandler({ listBoard: listPublicBoard })
