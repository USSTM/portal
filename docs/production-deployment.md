# Production deployment

The production stack runs Caddy, the Portal, reusable auth, the public website (Payload CMS), PostgreSQL, and the backup scheduler on one Docker host. Only Caddy publishes host ports. Caddy obtains and renews TLS certificates. On `PORTAL_ADDRESS` it sends `/auth/*` to auth and all other traffic to the Portal. All of `WEBSITE_ADDRESS` goes to the website.

## Host prerequisites

- A Linux host with Docker Engine and Docker Compose v2
- TCP ports 80 and 443 reachable from the internet
- DNS A/AAAA records for the Portal and the website pointing to the host
- An S3-compatible bucket for website media
- An S3-compatible bucket or another [restic repository](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html) located off the host

Copy `deployment/production.env.example` to a host-only file such as `/etc/usstm-portal/production.env`, fill every required value, and restrict it to the deployment operator. Do not commit that file. Generate the auth signing pair with `pnpm --filter @usstm/auth generate:session-key`; put the private JWK only in `AUTH_SESSION_PRIVATE_JWK` and the public JWK in `PORTAL_AUTH_PUBLIC_JWK`.

`PORTAL_ADDRESS` must be the public DNS name without a scheme. The origin inside `AUTH_CLIENTS` must be the corresponding `https://` origin. `DATABASE_URL` uses the private Compose hostname `postgres`; URL-encode reserved characters in its credentials.

## Validate, start, and migrate

You can run the full deployment pipeline with the included automation script (which defaults to `.env.production` or `.env` in the repository root, or accepts an explicit env file path / `ENV_FILE` variable):

```sh
./deployment/deploy.sh
# or
pnpm deploy:production
```

Alternatively, run the individual commands directly from the repository root:

```sh
docker compose --env-file .env.production -f compose.production.yaml config --quiet
docker compose --env-file .env.production -f compose.production.yaml --profile operations build
docker compose --env-file .env.production -f compose.production.yaml up -d postgres
docker compose --env-file .env.production -f compose.production.yaml --profile operations run --rm --build migrate
docker compose --env-file .env.production -f compose.production.yaml --profile operations run --rm --build website-migrate
docker compose --env-file .env.production -f compose.production.yaml up -d --wait
```

Compose rejects missing required configuration before creating containers. Auth also validates its client allowlist and signing key when it starts. Runtime secrets are injected into server containers; they are neither build arguments nor client-side Vite variables.

Apply migrations before starting a new application release. The migration command is safe to rerun and reaches PostgreSQL only over the private database network.

## Website database

`deployment/postgres/init/01-website.sh` creates the `usstm_website` role and database, but only the first time PostgreSQL initialises an empty volume. On a host whose volume already exists, create them once by hand before the first website deploy:

```sh
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml exec postgres \
  psql -U "$DATABASE_USER" -d "$DATABASE_NAME" -v ON_ERROR_STOP=1 \
  -c "CREATE ROLE usstm_website LOGIN PASSWORD '<WEBSITE_DATABASE_PASSWORD>'" \
  -c "CREATE DATABASE usstm_website OWNER usstm_website"
```

To move existing content off Supabase:

1. Restore a `pg_dump --no-owner --no-acl` of the old database into `usstm_website` as `usstm_website`.
2. Run `website-migrate`, then confirm `pnpm --filter @usstm/website payload migrate:status` is clean.
3. Point the `S3_*` variables at the media bucket.
4. After cutover, rotate the old Supabase credentials.

The old database still contains `events` tables; drop them once you have confirmed the website reads Events from the Portal.

## Health and logs

Check the public endpoints and container state:

```sh
curl --fail https://portal.example.com/health/live
curl --fail https://portal.example.com/health/ready
curl --fail https://portal.example.com/auth/health/live
curl --fail https://example.com/health/live
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml ps
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml logs --since 10m caddy portal auth
```

`/health/live` reports Portal process liveness. `/health/ready` returns HTTP 503 if Portal cannot query PostgreSQL. Caddy, Portal, and auth write JSON request records; `X-Request-ID` is returned to the caller and propagated into both application logs.

All long-running containers use `restart: unless-stopped`. Restart one application after a configuration change with:

```sh
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml up -d --no-deps --force-recreate portal
```

For a routine full-stack restart, use `docker compose ... restart`. PostgreSQL data and Caddy certificate state remain in named volumes.

## Backups

At 02:00 UTC every night, the backup container streams a custom-format `pg_dump` of each database directly into restic, tagged `usstm-portal` and `usstm-website`. Restic encrypts and authenticates the snapshot before writing it to `RESTIC_REPOSITORY`. The repository password should be independent of the database password and stored in a separate secrets backup.

Run a backup immediately and list snapshots with:

```sh
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml run --rm backup backup-now
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml run --rm backup restic snapshots
```

Regularly test restoration on a separate database host. To extract the newest dump:

```sh
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml run --rm backup restic dump latest /usstm-portal-YYYY-MM-DDTHH-MM-SSZ.dump > usstm-portal.dump
```

Restore it with `pg_restore` only into an empty recovery database. A snapshot is not a verified backup until that recovery exercise succeeds.
