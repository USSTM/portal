// Liveness only: answers without touching the database so the container is
// healthy before Payload migrations have run.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ status: 'ok' })
}
