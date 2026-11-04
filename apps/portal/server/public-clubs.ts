import { listPublicClubs } from '../src/features/clubs/club-profiles.js'

// Follows the Events API conventions (ADR-0005, docs/api/clubs.md).
const cacheControl = 'public, max-age=60'

export function createPublicClubsHandler(dependencies: {
  listClubs: typeof listPublicClubs
}) {
  return async function publicClubs(request: Request) {
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
    })
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      headers.set('Allow', 'GET, HEAD')
      return new Response(null, { headers, status: 405 })
    }
    if (request.method === 'HEAD') return new Response(null, { headers })
    return Response.json(await dependencies.listClubs(), { headers })
  }
}

export default createPublicClubsHandler({ listClubs: listPublicClubs })
