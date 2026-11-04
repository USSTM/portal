# Public Clubs API

The public Clubs API lists active Clubs and their Club Profiles for the Website and other USSTM surfaces, without authentication. It follows the Events API conventions (ADR-0005).

## List Clubs

```http
GET /api/v1/clubs
```

Returns every active Club, ordered by `fullName`. Archived Clubs are never included, and neither is the USSTM Club, which represents USSTM itself rather than an associated organization. There are no query parameters and no pagination.

## Response

```json
{
  "clubs": [
    {
      "id": "1c7a02f4-0737-4482-9f44-bfa664b3763d",
      "shortName": "RC",
      "fullName": "Robotics Club",
      "type": "student_group",
      "description": "We build robots.",
      "imageUrl": "/api/v1/club-images/0d3f7e52-5b0e-4c1a-9a43-6c1f2b8e9d10.png",
      "instagramHandle": "robotics",
      "websiteUrl": "https://robotics.example.com",
      "contactEmail": "robotics@example.com"
    }
  ]
}
```

Every Club Profile field is optional and is `null` when unset:

| Field             | Value                                                                |
| ----------------- | -------------------------------------------------------------------- |
| `type`            | `student_group` or `course_union`                                    |
| `description`     | Plain text, at most 1000 characters                                  |
| `imageUrl`        | A path on the Portal origin; resolve it against the Portal's address |
| `instagramHandle` | The handle without `@`; link to `https://www.instagram.com/<handle>` |
| `websiteUrl`      | An `https://` URL                                                    |
| `contactEmail`    | The Club's contact address                                           |

No Member, grant, lifecycle or audit information is included.

## Club images

```http
GET /api/v1/club-images/<imageId>
```

Serves a Club Profile image as JPEG, PNG or WebP. An image ID is random and never reused, so responses use `Cache-Control: public, max-age=86400`. An image is served only while an active Club uses it; otherwise, and for malformed IDs, the response is `404` with `Cache-Control: no-store`.

Images are uploaded in the Portal by that Club's Club Access holders and by Administrators. Uploads must be JPEG, PNG or WebP, detected from the file's content, and at most 2 MB. They are stored in a private S3-compatible bucket (`PORTAL_S3_*`) and served by the Portal, so they stay same-origin under the Portal's Content Security Policy.

## HTTP Behavior

Both endpoints:

- support `GET` and `HEAD`, and return `405` for other methods;
- send `Access-Control-Allow-Origin: *` to permit credential-free browser access.

`GET /api/v1/clubs` uses `Cache-Control: public, max-age=60`.
