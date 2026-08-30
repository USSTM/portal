#!/usr/bin/env bash
set -euo pipefail

# USSTM Portal - Production Deployment & Management Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

COMPOSE_FILE="${REPO_ROOT}/compose.production.yaml"

# Determine environment file location
# 1. First argument if it is an existing file
# 2. $ENV_FILE environment variable if set
# 3. .env.production in repo root if it exists
# 4. .env in repo root if it exists
ENV_FILE="${ENV_FILE:-}"

if [[ -n "${1:-}" && -f "${1}" ]]; then
  ENV_FILE="${1}"
  shift
fi

if [[ -z "${ENV_FILE}" ]]; then
  if [[ -f "${REPO_ROOT}/.env.production" ]]; then
    ENV_FILE="${REPO_ROOT}/.env.production"
  elif [[ -f "${REPO_ROOT}/.env" ]]; then
    ENV_FILE="${REPO_ROOT}/.env"
  fi
fi

usage() {
  cat <<EOF
USSTM Portal Production Deployment Script

Usage:
  $(basename "$0") [COMMAND] [OPTIONS]
  $(basename "$0") [ENV_FILE] [COMMAND]

Commands:
  up (default)    Validate config, build images, start database, run migrations, and start all services
  build           Build all production container images
  migrate         Run database schema migrations only
  restart         Restart running services
  down / stop     Stop and remove production containers
  logs            Stream logs from production containers (accepts service names, e.g. logs portal)
  status / ps     Display status of production containers
  backup          Trigger an immediate off-host database backup

Environment File Discovery:
  The script automatically searches for:
    1. ENV_FILE environment variable (e.g. ENV_FILE=.env.production $(basename "$0"))
    2. .env.production in the repository root
    3. .env in the repository root
    4. An explicit path passed as the first argument

Examples:
  ./deployment/deploy.sh
  ./deployment/deploy.sh .env.production up
  ./deployment/deploy.sh logs portal
  ./deployment/deploy.sh status
EOF
  exit "${1:-0}"
}

COMMAND="${1:-up}"

if [[ "${COMMAND}" == "-h" || "${COMMAND}" == "--help" || "${COMMAND}" == "help" ]]; then
  usage 0
fi

# Ensure env file exists
if [[ -z "${ENV_FILE}" || ! -f "${ENV_FILE}" ]]; then
  echo "Error: Production environment file not found." >&2
  echo "Please create '.env.production' or '.env' in the project root, or set ENV_FILE." >&2
  echo "Example: cp deployment/production.env.example .env.production" >&2
  exit 1
fi

# Verify Docker and Docker Compose
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: 'docker' is not installed or not available in PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: 'docker compose' (v2) is required." >&2
  exit 1
fi

# Helper function to run docker compose
compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

echo "Using environment file: ${ENV_FILE}"

case "${COMMAND}" in
  up)
    echo "==> 1. Validating Compose configuration..."
    compose config --quiet

    echo "==> 2. Building production images..."
    compose build

    echo "==> 3. Starting PostgreSQL..."
    compose up -d postgres

    echo "==> 4. Applying database schema migrations..."
    compose --profile operations run --rm migrate

    echo "==> 5. Starting full application stack..."
    compose up -d --wait

    echo "==> 6. Deployment complete! Container status:"
    compose ps
    ;;

  build)
    echo "==> Validating configuration and building images..."
    compose config --quiet
    compose build
    ;;

  migrate)
    echo "==> Starting database and applying migrations..."
    compose up -d postgres
    compose --profile operations run --rm migrate
    ;;

  restart)
    echo "==> Restarting production services..."
    compose restart
    compose ps
    ;;

  down|stop)
    echo "==> Stopping production stack..."
    compose down
    ;;

  logs)
    shift || true
    compose logs -f "$@"
    ;;

  ps|status)
    compose ps
    ;;

  backup)
    echo "==> Triggering on-demand backup..."
    compose run --rm backup backup-now
    ;;

  *)
    echo "Error: Unknown command '${COMMAND}'" >&2
    usage 1
    ;;
esac
