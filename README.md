# USSTM Portal

## Local stack

Use Node 22 with nvm, then install and start the complete local stack:

```sh
nvm use
pnpm install
cp .env.example .env
# Fill the blank secret and Google OAuth values in .env.
docker compose up --build
```

Portal: `http://localhost:3000`
Auth API: `http://localhost:3001/api/auth/*`

Each service serves `GET /health`. It returns `200 {"status":"ready"}` only
after its service-owned PostgreSQL role can query the database.

Run workspace checks with `pnpm build`, `pnpm typecheck`, and `pnpm test`. The
database integration check is `pnpm test:integration` and requires Docker.

## Google SSO setup

Create a Google Web OAuth client and register
`http://localhost:3001/api/auth/callback/google` as an authorized redirect URI.
Put its client ID and secret in `.env`; keep real secrets outside Git.

After PostgreSQL is running, provision the three initial USSTM Administrators
and the trusted portal client exactly once:

```sh
docker compose exec auth node dist/bootstrap-administrators.js \
  admin1@example.ca admin2@example.ca admin3@example.ca
docker compose exec auth node dist/bootstrap-portal-client.js
```

The portal uses authorization code flow with S256 PKCE. Its opaque, host-only
cookie has a 12-hour idle lifetime and a seven-day absolute lifetime. Signing
out revokes only the current portal session.
