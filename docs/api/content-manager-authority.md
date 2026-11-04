# Content Manager authority API

The Website asks the Portal whether the person behind a Website session is a Content Manager (ADR-0020). Payload calls this on every authenticated `/admin` request, so revoking Content Manager in the Portal takes effect immediately.

This is not a public API. Unlike `/api/v1/*`, it is unversioned, sends no CORS headers, and is never cached.

## Check authority

```http
GET /api/website/content-manager-authority
Authorization: Bearer <Website session>
```

The bearer token is the value of the `__Host-website-session` cookie, signed by the shared auth service for the `website` audience. The Portal verifies it with its existing public key and answers only for the email inside it, so a caller can only learn about their own authority.

## Response

```json
{
  "contentManager": true,
  "email": "editor@example.com"
}
```

`contentManager` is `true` for an active Member with the Content Manager grant, any active Administrator, and the Superuser. It is `false` for everyone else, including unknown and deactivated emails.

| Status | Meaning                                                                      |
| ------ | ---------------------------------------------------------------------------- |
| `200`  | The session is valid; the body states its authority.                         |
| `401`  | The bearer token is missing, malformed, expired or not signed for `website`. |
| `405`  | The method is not `GET`.                                                     |

Every response sends `Cache-Control: no-store`.

## Failure handling

The Website treats any failure to reach the Portal, or any non-`200` response, as a denial. It never admits a Content Manager without the Portal's confirmation.
