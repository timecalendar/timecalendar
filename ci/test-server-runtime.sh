#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/ci/.env.test"
IMAGE="${1:-}"
SERVICE_ACCOUNT_KEY="${2:-}"
PORT="${SERVER_RUNTIME_PORT:-$((20000 + RANDOM))}"
CONTAINER_NAME="timecalendar-server-runtime-${GITHUB_RUN_ID:-local}-$$"

log() { echo "[server-runtime] $*"; }

container_exists() {
  docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1
}

show_logs() {
  if container_exists; then
    docker logs "$CONTAINER_NAME" >&2 || true
  fi
}

fail() {
  show_logs
  echo "[server-runtime] ERROR: $*" >&2
  exit 1
}

cleanup() {
  if container_exists; then
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

[ -n "$IMAGE" ] || fail "usage: test-server-runtime.sh <image> <service-account-key>"
[ -f "$SERVICE_ACCOUNT_KEY" ] || fail "Firebase service-account key not found: $SERVICE_ACCOUNT_KEY"
command -v curl >/dev/null 2>&1 || fail "curl is not installed"
command -v docker >/dev/null 2>&1 || fail "docker is not installed"

image_command="$(docker image inspect --format '{{json .Config.Cmd}}' "$IMAGE")"
[ "$image_command" = '["node","dist/main"]' ] || \
  fail "expected image command [\"node\",\"dist/main\"], got $image_command"
log "image command is direct exec-form node"

docker run --detach \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  --env NODE_ENV=test \
  --env PORT="$PORT" \
  --env SMTP_URL=smtp://localhost:1025 \
  --network host \
  --volume "$SERVICE_ACCOUNT_KEY:/usr/src/app/config/serviceAccountKey.json:ro" \
  "$IMAGE" >/dev/null

log "waiting for GET /health/live on port $PORT"
for _ in $(seq 1 60); do
  if [ "$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME")" != "true" ]; then
    fail "container exited before serving liveness"
  fi

  response="$(curl --silent --show-error --fail "http://localhost:$PORT/health/live" || true)"
  if [ "$response" = '{"status":"ok"}' ]; then
    break
  fi
  sleep 1
done
[ "${response:-}" = '{"status":"ok"}' ] || fail "GET /health/live did not return the expected response within 60 seconds"

readiness_code="$(curl --silent --output /dev/null --write-out '%{http_code}' "http://localhost:$PORT/health")"
[ "$readiness_code" = "200" ] || fail "GET /health returned HTTP $readiness_code"
log "liveness and existing database-backed health routes are serving"

pid_one_command="$(docker exec "$CONTAINER_NAME" sh -c "tr '\\0' '\\n' </proc/1/cmdline | head -n 1")"
[ "$pid_one_command" = "node" ] || fail "expected PID 1 command node, got $pid_one_command"
log "PID 1 is node"

started_at="$(date +%s)"
docker stop --time 30 "$CONTAINER_NAME" >/dev/null
elapsed="$(( $(date +%s) - started_at ))"
exit_code="$(docker inspect --format '{{.State.ExitCode}}' "$CONTAINER_NAME")"

[ "$exit_code" != "137" ] || fail "container required SIGKILL after ${elapsed}s (exit 137)"
[ "$elapsed" -lt 30 ] || fail "container shutdown took ${elapsed}s (30s grace window)"
log "SIGTERM stopped the container in ${elapsed}s with exit code $exit_code"
