# Production baseline: shared infrastructure and CI/CD

Read-only inspection on 2026-11-15. This is a point-in-time baseline, not a recovery verification or authorization to change production.

## Host and access

- AWS account USSTM, region `ca-central-1`; instance `usstm-prod-ec2` (`i-04cbda819784edc31`), `t4g.medium`, ARM64 Ubuntu, Elastic IP `3.98.83.224`.
- Systems Manager agent is enabled and the node is online. Instance role `cv-backend-ec2-role` has `AmazonSSMManagedInstanceCore`, `CloudWatchAgentServerPolicy`, and inline `cv-backend-app-access`. IMDSv2 is required. SSM being online does not establish that a GitHub deployment role exists or is safely constrained.
- Security group `launch-wizard-2` permits public TCP 80 and 443, SSH from two specific IPv4 addresses, and all IPv4 outbound traffic. GitHub-hosted runners cannot be assumed to match the SSH allowlist.
- Root filesystem: 15 GB total, approximately 3.4 GB available (78% used). Docker reported approximately 4.3 GB build cache and 3.1 GB images; do not remove anything without checking its role in recovery.
- Local `gh` authentication is invalid, but Chrome is signed into GitHub with access to organization and Portal settings. The organization page showed seven repositories and a New repository control; no `infra` repository appeared. A private `SERVER-DOCS` repository exists and should be reviewed for relevant operational history.
- GitHub reports Portal's `main` branch is not protected. The existing workflow is a placeholder, not an established CI gate. Its latest main push (`a78789d`, run 43656415232) failed during `actions/setup-node`: pnpm cache setup could not locate `pnpm` before `pnpm/action-setup` ran. Implement and verify CI before depending on it for deployment. Portal showed no published packages. Actual creation, private GHCR pull permissions, Actions policy, and secrets remain unverified.

## Running services

- `/opt/portal` uses project `usstm-portal-production`; the live Caddyfile and production Compose file have the same SHA-256 hashes as this checkout. Server Git HEAD was `069f4f2`; untracked Caddy backups and a CSV are present and must be preserved.
- Caddy, Portal, auth, backup, and Portal PostgreSQL are running. Caddy, Portal, auth, and PostgreSQL report healthy; the backup container has no health check. All inspected containers use `restart: unless-stopped`.
- Caddy publishes TCP 80 and 443 and mounts `usstm-portal-production_caddy-data` at `/data` and `usstm-portal-production_caddy-config` at `/config`. Portal PostgreSQL uses `usstm-portal-production_postgres-data`.
- Inventory backend project `cv-backend-prod` uses `/opt/cv-backend/docker-compose.prod.yml`; frontend project `cv-frontend-prod` uses `/opt/cv-frontend/docker-compose.prod.yml`. Their application containers have no Docker health checks. Their database and Redis containers report healthy.
- Both inventory Compose files declare the external network `usstm-portal-production_application`. Backend uses alias `cv-backend-app` and frontend uses `cv-frontend-app`. Update the inventory repositories and deployed Compose definitions as part of the migration: a live network attachment alone will not survive recreation. Inventory CI/CD remains outside this phase.
- Portal and auth use aliases `portal` and `auth` on that network. Portal PostgreSQL is confined to its database network; inventory PostgreSQL and Redis use the inventory backend default network.
- Portal liveness, readiness, and auth liveness returned HTTP 200. Inventory frontend redirected once and returned HTTP 200. Inventory API root returned HTTP 404; this establishes a response, not API health. Select a meaningful non-mutating API endpoint before the cutover.

## Backup storage and risk

- Portal backups were never set up. The placeholder backup container repeatedly fails because its configured restic endpoint is `s3.example.com`. No valid off-host Portal snapshot or restore was established.
- The account's visible general-purpose S3 bucket is `cv-backend-prod-bucket` in `ca-central-1`. It contains inventory object prefixes and `db-backups/`. Block all public access is on, bucket-owner-enforced ownership disables ACLs, and default encryption is SSE-S3.
- Versioning and Object Lock are disabled. The enabled `expire-old-db-backups` lifecycle rule expires objects under `db-backups/` after 30 days. A second enabled rule applies to noncurrent versions across the entire bucket; evaluate its details before enabling versioning or putting backup data there.
- The instance role's inline policy allows `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` for **all objects** in this bucket, plus bucket-wide listing. Portal backups may share the bucket and its existing access boundary, per the user's preference. The policy also allows SES sending; avoid disrupting inventory when configuring backups.
- The repository backup script attempts `restic init` whenever `restic snapshots` fails, including transient failures; distinguish an absent repository from authentication, network, or corruption errors before using it for recovery-critical backups.

## Outstanding baseline work

- Verify the browser account's effective organization privileges, Actions policy, private package access, and secret configuration; restore local GitHub CLI authentication when needed. Review `SERVER-DOCS` for relevant server history.
- Inspect the full bucket lifecycle and confirm the backup identity before configuring the Portal prefix. Verify a separate recovery copy of the restic password.
- Identify safe inventory API health checks and verify application-specific functionality during a rehearsal.
- Verify the design and permissions of the future OIDC/SSM deployment identity; online SSM alone is not a deploy authorization.
