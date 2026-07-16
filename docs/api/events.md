# Public Events API

The public Events API exposes past and future USSTM Events without authentication.

## List Events

```http
GET /api/v1/events?from=<RFC3339>&to=<RFC3339>
```

Both query parameters are optional. Omitting both returns every Event. Results are ordered by `startAt` ascending.

A bounded query uses interval overlap semantics:

- `from` includes Events whose `endAt` is later than `from`.
- `to` includes Events whose `startAt` is earlier than `to`.
- When both are present, `from` must be earlier than `to`.

## Response

```json
{
  "events": [
    {
      "id": "655d9d94-95b7-4aa0-95a7-14bc610e9785",
      "title": "Example",
      "description": "Example description",
      "location": "KHE 127",
      "address": "40 Gould Street, Toronto",
      "startAt": "2026-09-15T18:00:00-04:00",
      "endAt": "2026-09-15T20:00:00-04:00",
      "owningClub": {
        "id": "1c7a02f4-0737-4482-9f44-bfa664b3763d",
        "shortName": "Club",
        "fullName": "Example Club"
      },
      "organizingClubs": []
    }
  ]
}
```

Personal creator and editor attribution is never included.

## Errors

Invalid timestamps and invalid ranges return `400 Bad Request`:

```json
{
  "error": {
    "code": "invalid_date_range",
    "message": "from must be earlier than to"
  }
}
```

## HTTP Behavior

- `GET` and `HEAD` are supported.
- Other methods are not supported.
- `Access-Control-Allow-Origin: *` permits credential-free browser access.
- Responses use `Cache-Control: public, max-age=60`.
- Timestamps are RFC 3339 values with explicit UTC offsets.
