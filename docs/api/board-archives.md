# Public Board Archives API

The public Board Archives API lists past USSTM boards for the Website and other USSTM surfaces, without authentication. It follows the Events API conventions (ADR-0005).

## List Board Archives

```http
GET /api/v1/board-archives
```

Returns every Board Archive, newest academic year first. There are no query parameters and no pagination.

## Response

```json
{
  "boardArchives": [
    {
      "academicYear": "2025-2026",
      "boardMembers": [
        { "displayName": "Jane Doe", "boardPosition": "President" },
        { "displayName": "Sam Lee", "boardPosition": "Vice President" }
      ]
    }
  ]
}
```

| Field                          | Value                                              |
| ------------------------------ | -------------------------------------------------- |
| `academicYear`                 | Two consecutive years, such as `2025-2026`; unique |
| `boardMembers`                 | The archived board, in the order it was archived   |
| `boardMembers[].displayName`   | The name as it was when archived                   |
| `boardMembers[].boardPosition` | The Board Position as it was when archived         |

A Board Archive holds names and Board Positions only. It never links to a Member and never includes a photo, bio, email address or other personal data, so later changes to Members do not change it.

## How archives are made

- **Archive current board:** on the Portal's Board Members page, an Administrator or the Superuser freezes the current board, in its Website order (`docs/api/board.md`), as the board for an academic year. The action is audited (`board_archive.created`).
- **Legacy import:** past boards from the Website's BoardHistory were loaded once in the same form (`board_archive.imported`). See "Copy Website data into the Portal" in `docs/production-deployment.md`.

There is at most one Board Archive per academic year. Archives cannot be edited or deleted: the database rejects any change. There is no re-import; an import skips years that already have an archive.

## HTTP Behavior

- `GET` and `HEAD` are supported, and other methods return `405`.
- `Access-Control-Allow-Origin: *` permits credential-free browser access.
- Responses use `Cache-Control: public, max-age=60`.
