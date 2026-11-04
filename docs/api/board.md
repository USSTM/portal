# Public Board API

The public Board API lists the current USSTM board for the Website and other USSTM surfaces, without authentication. It follows the Events API conventions (ADR-0005).

## List the current board

```http
GET /api/v1/board
```

Returns every active Member who currently holds Board Member authority, including Administrators who do. There are no query parameters and no pagination.

## Response

```json
{
  "boardMembers": [
    {
      "displayName": "Jane Doe",
      "boardPosition": "President",
      "bio": "Fourth-year chemistry student.",
      "photoUrl": "/api/v1/board-photos/0d3f7e52-5b0e-4c1a-9a43-6c1f2b8e9d10.jpg"
    }
  ]
}
```

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| `displayName`   | The Member's display name                                             |
| `boardPosition` | Their Board Position                                                  |
| `bio`           | Their Member Profile bio, at most 500 characters, or `null`           |
| `photoUrl`      | A path on the Portal origin for their Member Profile photo, or `null` |

No email address, Member ID, grant, lifecycle or audit information is included. A Member Profile is public only while its Member is a Board Member (`docs/PRIVACY.md`); it leaves this list, and its photo stops being served, as soon as Board Member authority is revoked or the Member is deactivated.

## Ordering

Administrators set the order of Board Positions under **Website Order** on the Portal's Board Members page. The list is sorted by:

1. the Administrator-set position of the Member's Board Position;
2. Board Positions without a set position, alphabetically after the ordered ones;
3. display name, for Members who share a Board Position.

## Board photos

```http
GET /api/v1/board-photos/<photoId>
```

Serves a Member Profile photo as JPEG, PNG or WebP, only while its Member is an active Board Member. Otherwise, and for malformed IDs, the response is `404` with `Cache-Control: no-store`. Photo IDs are random and never reused. Responses use `Cache-Control: public, max-age=300`, kept short so a photo does not linger after its Member leaves the board.

## HTTP Behavior

Both endpoints:

- support `GET` and `HEAD`, and return `405` for other methods;
- send `Access-Control-Allow-Origin: *` to permit credential-free browser access.

`GET /api/v1/board` uses `Cache-Control: public, max-age=60`.
