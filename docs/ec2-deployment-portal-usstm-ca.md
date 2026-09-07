# Deploy USSTM Portal to AWS EC2

The repo already supports this setup: one EC2 host running Docker Compose, with Caddy providing HTTPS and routing traffic to the Portal/Auth containers. See [`docs/production-deployment.md`](production-deployment.md).

## 1. Create the EC2 instance

In AWS EC2:

- Region: preferably `ca-central-1`
- AMI: Ubuntu Server 24.04 LTS
- Instance type: `t3.medium` or larger
- Allocate an Elastic IP and associate it with the instance
- Security group inbound rules:
  - TCP 22 from your IP
  - TCP 80 from anywhere
  - TCP 443 from anywhere

AWS documents the HTTP/HTTPS rules [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html).

Create DNS:

```text
portal.usstm.ca  A  <Elastic-IP>
```

If using Route 53, create an `A – IPv4 address` record as described [here](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-ec2-instance.html).

Wait until this works:

```bash
dig +short portal.usstm.ca
```

## 2. SSH into the server and install Docker

```bash
ssh -i /path/to/key.pem ubuntu@<ELASTIC-IP>
```

```bash
sudo apt update
sudo apt install -y ca-certificates curl git

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc" |
  sudo tee /etc/apt/sources.list.d/docker.sources

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker ubuntu
```

Log out and back in:

```bash
exit
ssh -i /path/to/key.pem ubuntu@<ELASTIC-IP>
```

Verify:

```bash
docker compose version
```

These packages follow Docker’s current Ubuntu installation instructions [here](https://docs.docker.com/engine/install/ubuntu/).

## 3. Clone the application

```bash
sudo mkdir -p /opt/portal
sudo chown ubuntu:ubuntu /opt/portal

git clone https://github.com/USSTM/portal.git /opt/portal
cd /opt/portal
```

## 4. Generate authentication signing keys

On your development machine, from the repository root:

```bash
pnpm install
pnpm --filter @usstm/auth generate:session-key
```

Copy the generated environment lines temporarily. You will need:

```text
AUTH_SESSION_KEY_ID=...
PORTAL_AUTH_KEY_ID=...
AUTH_SESSION_PRIVATE_JWK='...'
PORTAL_AUTH_PUBLIC_JWK='...'
```

Do not commit the private JWK.

## 5. Create the production environment file

On EC2:

```bash
cd /opt/portal
cp deployment/production.env.example .env.production
nano .env.production
```

Use values like these:

```dotenv
PORTAL_ADDRESS=portal.usstm.ca

DATABASE_NAME=usstm_portal
DATABASE_USER=usstm
DATABASE_PASSWORD=replace-with-hex-password
DATABASE_URL=postgresql://usstm:replace-with-hex-password@postgres:5432/usstm_portal

AUTH_SESSION_ISSUER=usstm-auth
AUTH_SESSION_KEY_ID=current
AUTH_SESSION_PRIVATE_JWK='paste-private-jwk-here'

PORTAL_AUTH_ISSUER=usstm-auth
PORTAL_AUTH_KEY_ID=current
PORTAL_AUTH_PUBLIC_JWK='paste-public-jwk-here'

AUTH_CLIENTS=[{"audience":"portal","callbackPath":"/auth/callback","clientId":"GOOGLE_CLIENT_ID","clientSecret":"GOOGLE_CLIENT_SECRET","cookieName":"__Host-portal-session","origin":"https://portal.usstm.ca"}]

PORTAL_SUPERUSER_EMAIL=your-email@example.com

PORTAL_CONTACT_EMAIL=info@usstm.ca
PORTAL_CONTACT_INSTAGRAM=https://www.instagram.com/usstm
PORTAL_CONTACT_LINKTREE=https://linktr.ee/usstm
PORTAL_CONTACT_WEBSITE=https://usstm.ca

RESTIC_REPOSITORY=s3:s3.amazonaws.com/temporary-unused-bucket
RESTIC_PASSWORD=temporary-backup-password
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=ca-central-1
```

Generate a database password easily:

```bash
openssl rand -hex 24
```

Use the same generated value in both `DATABASE_PASSWORD` and the password portion of `DATABASE_URL`.

## 6. Configure Google OAuth

In your Google OAuth client configuration, add this authorized redirect URI:

```text
https://portal.usstm.ca/auth/callback
```

Put the Google client ID and secret into `AUTH_CLIENTS`.

## 7. Start the app without the optional backup container

Since the immediate goal is site accessibility, skip the backup service for now:

```bash
cd /opt/portal

docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  config --quiet

docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  build

docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  up -d postgres

docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  --profile operations \
  run --rm migrate

docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  up -d --wait postgres auth portal caddy
```

The placeholder Restic values are only present because Compose requires those variables during configuration. The backup container is not started.

Check status:

```bash
docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  ps
```

Test the site:

```bash
curl -f https://portal.usstm.ca/health/live
curl -f https://portal.usstm.ca/health/ready
curl -f https://portal.usstm.ca/auth/health/live
```

Then open:

```text
https://portal.usstm.ca
```

Caddy should automatically obtain the HTTPS certificate once DNS points to the EC2 Elastic IP and ports 80/443 are reachable.

## 8. View logs if something fails

```bash
docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  logs --tail=200 caddy portal auth postgres
```

For future code updates:

```bash
cd /opt/portal
git pull
docker compose --env-file .env.production -f compose.production.yaml build
docker compose --env-file .env.production -f compose.production.yaml --profile operations run --rm migrate
docker compose --env-file .env.production -f compose.production.yaml up -d --wait postgres auth portal caddy
```

The most common first-deployment failures are DNS not propagated yet, ports 80/443 missing from the security group, or invalid JSON in `AUTH_CLIENTS`.
