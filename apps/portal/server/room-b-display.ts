import { getRoomBDisplaySchedule } from '../src/features/room-b/schedule.js'

export default async function roomBDisplay(request: Request) {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }
  if (request.method !== 'GET')
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: 'GET' },
    })
  try {
    return Response.json(await getRoomBDisplaySchedule(), { headers })
  } catch {
    return Response.json(
      { error: 'Schedule temporarily unavailable' },
      { status: 503, headers },
    )
  }
}
