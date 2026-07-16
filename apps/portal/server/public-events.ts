import { listPublicEvents } from '../src/features/events/public-events.js'

const cacheControl = 'public, max-age=60'
type RangeParseResult =
  | { error: { code: 'invalid_date_range'; message: string } }
  | { from?: Date; to?: Date }
type TimestampParseResult =
  { error: { code: 'invalid_date_range'; message: string } } | { value?: Date }

export default async function publicEvents(request: Request) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': cacheControl,
  })
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    headers.set('Allow', 'GET, HEAD')
    return new Response(null, { headers, status: 405 })
  }

  const range = parseRange(new URL(request.url).searchParams)
  if ('error' in range) {
    return Response.json({ error: range.error }, { headers, status: 400 })
  }
  const body = request.method === 'HEAD' ? null : await listPublicEvents(range)
  return body === null
    ? new Response(null, { headers })
    : Response.json(body, { headers })
}

function parseRange(params: URLSearchParams): RangeParseResult {
  const from = parseTimestamp(params.get('from'), 'from')
  if ('error' in from) return from
  const to = parseTimestamp(params.get('to'), 'to')
  if ('error' in to) return to
  if (from.value && to.value && from.value >= to.value) {
    return {
      error: {
        code: 'invalid_date_range',
        message: 'from must be earlier than to',
      },
    }
  }
  return { from: from.value, to: to.value }
}

function parseTimestamp(
  value: string | null,
  name: 'from' | 'to',
): TimestampParseResult {
  if (value === null) return { value: undefined }
  const timestamp = new Date(value)
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    Number.isNaN(timestamp.getTime())
  ) {
    return {
      error: {
        code: 'invalid_date_range',
        message: `${name} must be a valid RFC 3339 timestamp`,
      },
    }
  }
  return { value: timestamp }
}
