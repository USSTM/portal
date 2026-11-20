#!/usr/bin/env bash
set -euo pipefail
umask 077

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
state_dir="${DEPLOY_STATE_DIR:-/opt/usstm-portal-release}"
app_env="${APP_ENV_FILE:-/opt/portal/.env.production}"
origin="${PORTAL_HEALTH_ORIGIN:-https://portal.usstm.ca}"

for field in PORTAL_IMAGE AUTH_IMAGE MIGRATE_IMAGE BACKUP_IMAGE RELEASE_SHA RELEASE_RUN_NUMBER ROLLBACK_COMPATIBLE; do
  [[ -n "${!field:-}" ]] || { echo "$field is required" >&2; exit 1; }
done
[[ "$PORTAL_IMAGE" =~ ^ghcr\.io/usstm/portal-web@sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid Portal image' >&2; exit 1; }
[[ "$AUTH_IMAGE" =~ ^ghcr\.io/usstm/portal-auth@sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid auth image' >&2; exit 1; }
[[ "$MIGRATE_IMAGE" =~ ^ghcr\.io/usstm/portal-migrate@sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid migration image' >&2; exit 1; }
[[ "$BACKUP_IMAGE" =~ ^ghcr\.io/usstm/portal-backup@sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid backup image' >&2; exit 1; }
[[ "$RELEASE_SHA" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid release commit' >&2; exit 1; }
[[ "$RELEASE_RUN_NUMBER" =~ ^[1-9][0-9]{0,9}$ ]] || { echo 'Invalid run number' >&2; exit 1; }
[[ "$ROLLBACK_COMPATIBLE" == true || "$ROLLBACK_COMPATIBLE" == false ]] || { echo 'Invalid rollback setting' >&2; exit 1; }

mkdir -p "$state_dir"
exec 9>"$state_dir/deploy.lock"
flock -x 9
if [[ -f "$state_dir/highest-run" ]]; then
  highest_run="$(cat "$state_dir/highest-run")"
  [[ "$highest_run" =~ ^[1-9][0-9]{0,9}$ ]] || { echo 'Invalid release ordering state' >&2; exit 1; }
  if (( 10#$RELEASE_RUN_NUMBER < 10#$highest_run )); then
    echo 'Release superseded by a newer attempted run.'
    exit 0
  fi
fi
if [[ -f "$state_dir/current.env" ]]; then
  current_run="$(sed -n 's/^RELEASE_RUN_NUMBER=//p' "$state_dir/current.env")"
  [[ "$current_run" =~ ^[1-9][0-9]{0,9}$ ]] || { echo 'Invalid previous release state' >&2; exit 1; }
  if (( 10#$RELEASE_RUN_NUMBER <= 10#$current_run )); then
    echo 'Release superseded by an already deployed run.'
    exit 0
  fi
  if [[ -n "${RELEASE_GIT_DIR:-}" ]]; then
    current_sha="$(sed -n 's/^RELEASE_SHA=//p' "$state_dir/current.env")"
    ROLLBACK_COMPATIBLE=false
    if [[ "$current_sha" =~ ^[a-f0-9]{40}$ ]] &&
      git --git-dir="$RELEASE_GIT_DIR" diff --quiet --no-renames "$current_sha" "$RELEASE_SHA" -- \
        apps/portal/drizzle apps/portal/drizzle.config.ts apps/portal/src/db \
        apps/portal/package.json package.json pnpm-lock.yaml pnpm-workspace.yaml patches; then
      ROLLBACK_COMPATIBLE=true
    fi
  fi
fi
printf '%s\n' "$RELEASE_RUN_NUMBER" > "$state_dir/highest-run.tmp"
mv -f "$state_dir/highest-run.tmp" "$state_dir/highest-run"
candidate="$(mktemp "$state_dir/.candidate.XXXXXX")"
trap 'rm -f "$candidate"' EXIT
chmod 600 "$candidate"
printf 'PORTAL_IMAGE=%s\nAUTH_IMAGE=%s\nMIGRATE_IMAGE=%s\nBACKUP_IMAGE=%s\nRELEASE_SHA=%s\nRELEASE_RUN_NUMBER=%s\n' \
  "$PORTAL_IMAGE" "$AUTH_IMAGE" "$MIGRATE_IMAGE" "$BACKUP_IMAGE" "$RELEASE_SHA" "$RELEASE_RUN_NUMBER" > "$candidate"
unset PORTAL_IMAGE AUTH_IMAGE MIGRATE_IMAGE BACKUP_IMAGE RELEASE_SHA RELEASE_RUN_NUMBER

compose() {
  docker compose --env-file "$app_env" --env-file "$1" \
    -f "$root/compose.production.yaml" -f "$root/deployment/compose.shared.yaml" \
    -f "$root/deployment/compose.images.yaml" "${@:2}"
}

compose "$candidate" --profile operations config --quiet
compose "$candidate" --profile operations pull portal auth migrate backup
compose "$candidate" up -d --no-recreate --wait postgres
compose "$candidate" run --rm --no-deps --pull=never backup backup-now
compose "$candidate" --profile operations run --rm --no-deps --pull=never migrate
if ! compose "$candidate" up -d --no-deps --no-build --wait portal auth backup ||
  ! curl --fail --silent --show-error --retry 5 --retry-delay 2 "$origin/health/ready" >/dev/null ||
  ! curl --fail --silent --show-error --retry 5 --retry-delay 2 "$origin/auth/health/live" >/dev/null; then
  echo 'Release health checks failed.' >&2
  if [[ "$ROLLBACK_COMPATIBLE" == true && -f "$state_dir/current.env" ]]; then
    echo 'Restoring the previous application images.' >&2
    if ! compose "$state_dir/current.env" up -d --no-deps --no-build --wait portal auth backup ||
      ! curl --fail --silent --show-error --retry 5 --retry-delay 2 "$origin/health/ready" >/dev/null ||
      ! curl --fail --silent --show-error --retry 5 --retry-delay 2 "$origin/auth/health/live" >/dev/null; then
      echo 'Rollback failed; manual intervention is required.' >&2
    fi
  else
    echo 'Automatic rollback is unavailable; manual intervention is required.' >&2
  fi
  exit 1
fi
mv -f "$candidate" "$state_dir/current.env"
