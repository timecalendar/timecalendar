#!/usr/bin/env bash
#
# e2e-server.sh — shared, compose-first lifecycle for the e2e server stack
# (NestJS + Postgres + Redis), consumed by every e2e harness in the repo
# (Flutter: app/integration_test/run_e2e.sh; mobile: mobile/e2e/run_e2e.sh).
#
# Docker owns the lifecycle: boot is `docker compose up --wait`, teardown is
# `down`, logs are `compose logs` — no hand-rolled process-group management,
# readiness polling, or log-file juggling. See add-mobile-test-harness design
# D3/D4 for the rationale and the --native seam.
#
# Usage:
#   ci/e2e-server.sh up   [--native]   boot + seed a healthy stack on port 3005
#   ci/e2e-server.sh down [--native]   stop and remove everything it started
#   ci/e2e-server.sh logs [--native]   print the server's logs
#
# Modes:
#   compose (default)  Docker owns Postgres, Redis, and the server. Builds the
#                      server image from source unless E2E_SERVER_IMAGE is set
#                      (CI points it at the prebuilt `build-server` artifact).
#   --native           For Docker-less hosts (GitHub macOS runners): the caller
#                      provisions Postgres/Redis; this script seeds, mints the
#                      key, boots the server from source as a backgrounded
#                      pid-tracked process, and waits on /health. Only service
#                      provisioning differs — seed/key/env/port/health are
#                      single-sourced here.
#
# Env:
#   E2E_SERVER_IMAGE   compose mode: prebuilt server image to use (skips build).

set -euo pipefail

# --- Paths -------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
COMPOSE_FILE="$SERVER_DIR/docker-compose.yml"
COMPOSE_E2E_FILE="$SERVER_DIR/docker-compose.e2e.yml"
SERVICE_ACCOUNT_KEY="$SERVER_DIR/config/serviceAccountKey.json"

# --- Config ------------------------------------------------------------------
BACKEND_PORT=3005
# Native-mode artifacts (compose mode keeps all of this inside Docker).
NATIVE_PID_FILE="${TMPDIR:-/tmp}/timecalendar-e2e-server.pid"
NATIVE_LOG_FILE="${TMPDIR:-/tmp}/timecalendar-e2e-server.log"

log()  { echo "[e2e-server] $*"; }
fail() { echo "[e2e-server] ERROR: $*" >&2; exit 1; }

compose() { docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_E2E_FILE" "$@"; }

# --- Shared steps ------------------------------------------------------------
# server/src/config/firebase.ts reads serviceAccountKey.json at import time, so
# the server cannot boot without it; nothing in the e2e path calls Firebase. An
# existing file (e.g. a developer's real key) is left untouched.
ensure_dummy_key() {
  if [ -f "$SERVICE_ACCOUNT_KEY" ]; then
    log "Firebase service-account key already present — leaving it untouched."
  else
    log "generating dummy Firebase service-account key (throwaway RSA key)…"
    "$SCRIPT_DIR/generate-dummy-firebase-key.sh" "$SERVICE_ACCOUNT_KEY"
  fi
}

# Poll /health until it reports healthy. Used in native mode; compose mode lets
# `up --wait` block on the service healthcheck instead.
wait_for_health() {
  local code pid
  log "waiting for GET /health on port $BACKEND_PORT…"
  for _ in $(seq 1 60); do
    if [ -f "$NATIVE_PID_FILE" ]; then
      pid="$(cat "$NATIVE_PID_FILE")"
      if ! kill -0 "$pid" 2>/dev/null; then
        [ -f "$NATIVE_LOG_FILE" ] && cat "$NATIVE_LOG_FILE" >&2
        fail "server process exited before becoming ready (see log above)."
      fi
    fi
    code="$(curl -s -o /dev/null -w '%{http_code}' \
      "http://localhost:$BACKEND_PORT/health" || true)"
    if [ "$code" = "200" ]; then
      log "server is healthy."
      return 0
    fi
    sleep 1
  done
  [ -f "$NATIVE_LOG_FILE" ] && cat "$NATIVE_LOG_FILE" >&2
  fail "GET /health did not return 200 within 60s (see log above)."
}

# --- Compose mode ------------------------------------------------------------
up_compose() {
  command -v docker >/dev/null 2>&1 || fail "docker is not installed."
  ensure_dummy_key

  # CI sets E2E_SERVER_IMAGE to the loaded build-server artifact — reuse it
  # as-is. Locally, build from source (layer-cached).
  local build_flag="--build"
  if [ -n "${E2E_SERVER_IMAGE:-}" ]; then
    build_flag=""
    log "using prebuilt server image: $E2E_SERVER_IMAGE"
  fi

  # Name `server` explicitly so compose brings up only it and its depends_on
  # (postgres, redis) — not the base file's nginx, which e2e doesn't need (it
  # binds 1443 and needs certs).
  log "bringing up Postgres, Redis, and the server (compose up --wait)…"
  # shellcheck disable=SC2086  # build_flag is intentionally word-split (may be empty)
  compose up --wait $build_flag server

  # One-shot seed: drop + migrate + seed timecalendar_test. Runs inside the
  # compose network, so it inherits DATABASE_HOST=postgres from the service env.
  log "seeding the timecalendar_test database (db:init)…"
  compose run --rm server npm run db:init

  log "stack up — API serving on http://localhost:$BACKEND_PORT"
}

down_compose() {
  command -v docker >/dev/null 2>&1 || fail "docker is not installed."
  log "tearing down the compose stack…"
  compose down
}

logs_compose() {
  compose logs --no-color server
}

# --- Native mode (Docker-less hosts, D4) -------------------------------------
up_native() {
  command -v curl   >/dev/null 2>&1 || fail "curl is not installed."
  ensure_dummy_key

  if [ ! -d "$SERVER_DIR/node_modules" ]; then
    log "installing server dependencies (npm ci)…"
    ( cd "$SERVER_DIR" && npm ci )
  fi

  # NODE_ENV=test → isolated timecalendar_test DB, reaching the Postgres/Redis
  # the caller provisioned on the standard host ports (test-env defaults).
  log "seeding the timecalendar_test database (db:init)…"
  ( cd "$SERVER_DIR" && NODE_ENV=test PORT="$BACKEND_PORT" npm run db:init )

  log "starting the NestJS backend on port $BACKEND_PORT…"
  # setsid → own process group (PGID == PID), so `down` can signal the whole
  # tree: `npm run start` → `nest` → `node`.
  setsid bash -c '
    cd "$1" || exit 1
    exec env NODE_ENV=test PORT="$2" SMTP_URL="smtp://localhost:1025" \
      npm run start
  ' _ "$SERVER_DIR" "$BACKEND_PORT" > "$NATIVE_LOG_FILE" 2>&1 &
  echo "$!" > "$NATIVE_PID_FILE"
  log "backend pid/pgid $(cat "$NATIVE_PID_FILE") — log: $NATIVE_LOG_FILE"

  wait_for_health
  log "stack up — API serving on http://localhost:$BACKEND_PORT"
}

down_native() {
  if [ ! -f "$NATIVE_PID_FILE" ]; then
    log "no native pid file ($NATIVE_PID_FILE) — nothing to tear down."
    return 0
  fi
  local pid
  pid="$(cat "$NATIVE_PID_FILE")"
  if kill -0 "$pid" 2>/dev/null; then
    log "stopping the native backend (pid/pgid $pid)…"
    # Negative PID signals the whole process group.
    kill -TERM -- "-$pid" 2>/dev/null \
      || kill -TERM "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
  rm -f "$NATIVE_PID_FILE"
}

logs_native() {
  [ -f "$NATIVE_LOG_FILE" ] && cat "$NATIVE_LOG_FILE" || \
    log "no native log file at $NATIVE_LOG_FILE."
}

# --- Argument parsing --------------------------------------------------------
COMMAND="${1:-}"
[ -n "$COMMAND" ] || fail "usage: e2e-server.sh up|down|logs [--native]"
shift

NATIVE=0
for arg in "$@"; do
  case "$arg" in
    --native) NATIVE=1 ;;
    *) fail "unknown argument: $arg" ;;
  esac
done

case "$COMMAND" in
  up)   if [ "$NATIVE" -eq 1 ]; then up_native;   else up_compose;   fi ;;
  down) if [ "$NATIVE" -eq 1 ]; then down_native; else down_compose; fi ;;
  logs) if [ "$NATIVE" -eq 1 ]; then logs_native; else logs_compose; fi ;;
  *)    fail "unknown command: $COMMAND (expected up|down|logs)" ;;
esac
