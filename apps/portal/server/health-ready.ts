import { checkDatabase } from '../src/db/health.js'
import { getReadiness } from '../src/health.js'

export default async () => {
  const readiness = await getReadiness(checkDatabase)
  const status = readiness.status === 'ok' ? 200 : 503

  return Response.json(readiness, { status })
}
