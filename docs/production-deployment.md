# Production deployment

The production stack runs Caddy, the Portal, reusable auth, PostgreSQL, and the backup scheduler on one Docker host. Only Caddy publishes host ports. Caddy obtains and renews TLS certificates, sends `/auth/*` to auth, and sends all other traffic to the Portal.

## Host prerequisites

- A Linux host with Docker Engine and Docker Compose v2
- TCP ports 80 and 443 reachable from the internet
- A DNS A/AAAA record for the Portal pointing to the host
- An S3-compatible bucket or another [restic repository](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html) located off the host

Copy `deployment/production.env.example` to a host-only file such as `/etc/usstm-portal/production.env`, fill every required value, and restrict it to the deployment operator. Do not commit that file. Generate the auth signing pair with `pnpm --filter @usstm/auth generate:session-key`; put the private JWK only in `AUTH_SESSION_PRIVATE_JWK` and the public JWK in `PORTAL_AUTH_PUBLIC_JWK`.

`PORTAL_ADDRESS` must be the public DNS name without a scheme. The origin inside `AUTH_CLIENTS` must be the corresponding `https://` origin. `DATABASE_URL` uses the private Compose hostname `postgres`; URL-encode reserved characters in its credentials.

## Validate, start, and migrate

Run all commands from the repository root, replacing the environment path if needed:

```sh
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml config --quiet
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml build
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml up -d postgres
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml --profile operations run --rm migrate
docker compose --env-file /etc/usstm-portal/production.env -f compose.production.yaml up -d --wait
```

Compose rejects missing required configuration before creating containers. Auth also validates its client allowlist and signing key when it starts. Runtime secrets are injected into server containers; they are neither build arguments nor client-side Vite variables.

Apply migrations before starting a new application release. The migration command is safe to rerun and reaches PostgreSQL only over the private database network.

## Health and logs

Check the public endpoints and container state:

```sh
curl --fail https://portal.example.com/health/live
curl --fail https://portal.example.com/health/ready
curl --fail https://portal.example.com/auth/health/live
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

At 02:00 UTC every night, the backup container streams a custom-format `pg_dump` directly into restic. Restic encrypts and authenticates the snapshot before writing it to `RESTIC_REPOSITORY`. The repository password should be independent of the database password and stored in a separate secrets backup.

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
