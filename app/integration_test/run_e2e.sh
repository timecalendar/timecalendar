#!/usr/bin/env bash
#
# run_e2e.sh — single-command end-to-end smoke harness for TimeCalendar.
#
# Boots the NestJS backend + Postgres/Redis, seeds deterministic fixtures into
# the isolated `timecalendar_test` database, runs the Flutter integration_test
# against the live backend, and tears everything down (on success *and*
# failure). The script's exit code is the Flutter test's exit code.
#
# Usage:
#   ./integration_test/run_e2e.sh [--keep-up]
#     --keep-up   Leave the backend process and Docker containers running
#                 after the test, for debugging. Default is to tear down.
#
# Prerequisites and CI notes: see integration_test/README.md.

set -euo pipefail

# --- Arguments ---------------------------------------------------------------
KEEP_UP=0
for arg in "$@"; do
  case "$arg" in
    --keep-up) KEEP_UP=1 ;;
    *) echo "run_e2e.sh: unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# --- Paths -------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$APP_DIR/.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
COMPOSE_FILE="$SERVER_DIR/docker-compose.yml"

# --- Config ------------------------------------------------------------------
BACKEND_PORT=3005
PG_HOSTPORT="localhost:37291"
# Host the Flutter app uses to reach the backend. 10.0.2.2 is the host
# loopback as seen from an Android emulator; override for a physical device.
E2E_API_HOST="${E2E_API_HOST:-10.0.2.2}"
BACKEND_LOG="$(mktemp -t e2e-backend-XXXXXX.log)"
BACKEND_PID=""

log()  { echo "[run_e2e] $*"; }
fail() { echo "[run_e2e] ERROR: $*" >&2; exit 1; }

# --- Teardown (runs on every exit) -------------------------------------------
teardown() {
  local code=$?
  if [ "$KEEP_UP" -eq 1 ]; then
    log "--keep-up set: leaving backend (pid ${BACKEND_PID:-none}) and containers up."
    log "backend log: $BACKEND_LOG"
    exit "$code"
  fi
  log "tearing down…"
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    # The backend runs in its own process group (see step 4). A negative PID
    # signals the whole group — `npm run start` spawns `nest`, which spawns
    # the `node` server; killing only `npm` would orphan them.
    kill -TERM -- "-$BACKEND_PID" 2>/dev/null \
      || kill -TERM "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
  exit "$code"
}
trap teardown EXIT

# --- Preflight ---------------------------------------------------------------
command -v docker  >/dev/null 2>&1 || fail "docker is not installed."
command -v flutter >/dev/null 2>&1 || fail \
  "flutter is not on PATH. The SDK is not on PATH by default — run:
    export PATH=\"/home/dev/flutter/bin:\$PATH\""
command -v curl   >/dev/null 2>&1 || fail "curl is not installed."
command -v python3 >/dev/null 2>&1 || fail "python3 is not installed."

# --- 1. Start Postgres + Redis ----------------------------------------------
log "starting Postgres + Redis…"
docker compose -f "$COMPOSE_FILE" up -d postgres redis

# --- 2. Wait for Postgres ----------------------------------------------------
log "waiting for Postgres at $PG_HOSTPORT…"
"$REPO_ROOT/ci/wait.sh" "$PG_HOSTPORT" -t 60 \
  || fail "Postgres did not accept connections within 60s."

# --- 3. Seed the timecalendar_test database ----------------------------------
if [ ! -d "$SERVER_DIR/node_modules" ]; then
  log "installing server dependencies (npm ci)…"
  ( cd "$SERVER_DIR" && npm ci )
fi
# NODE_ENV=test → isolated `timecalendar_test` DB; never touches dev data.
# SMTP_URL must be a non-empty URL: MailerService builds a transport at
# construction time and the test env config leaves SMTP_URL unset.
log "seeding the timecalendar_test database (db:init: drop + migrate + seed)…"
( cd "$SERVER_DIR" && NODE_ENV=test PORT="$BACKEND_PORT" npm run db:init )

# --- 4. Start the backend ----------------------------------------------------
log "starting the NestJS backend on port $BACKEND_PORT…"
# `setsid` runs the backend as its own process-group leader (PGID == PID), so
# teardown can signal the whole tree: `npm run start` → `nest` → `node`.
setsid bash -c '
  cd "$1" || exit 1
  exec env NODE_ENV=test PORT="$2" SMTP_URL="smtp://localhost:1025" \
    npm run start
' _ "$SERVER_DIR" "$BACKEND_PORT" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
log "backend pid/pgid $BACKEND_PID — log: $BACKEND_LOG"

# --- 5. Poll GET /schools until ready ----------------------------------------
log "waiting for GET /schools to return HTTP 200…"
schools_ready=0
for _ in $(seq 1 60); do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    cat "$BACKEND_LOG" >&2
    fail "backend process exited before becoming ready (see log above)."
  fi
  code="$(curl -s -o /dev/null -w '%{http_code}' \
    "http://localhost:$BACKEND_PORT/schools" || true)"
  if [ "$code" = "200" ]; then schools_ready=1; break; fi
  sleep 1
done
if [ "$schools_ready" -ne 1 ]; then
  cat "$BACKEND_LOG" >&2
  fail "GET /schools did not return 200 within 60s (see log above)."
fi
log "backend is up — /schools serves the seeded schools."

# --- 6. Resolve an Android target device ------------------------------------
log "resolving an Android target device…"
DEVICE_ID="$(flutter devices --machine 2>/dev/null | python3 -c '
import json, sys
try:
    devices = json.load(sys.stdin)
except Exception:
    devices = []
print(next((d["id"] for d in devices
            if str(d.get("targetPlatform", "")).startswith("android")), ""))
' || true)"
if [ -z "$DEVICE_ID" ]; then
  fail "no Android device/emulator detected by 'flutter devices'.
  The happy-path test runs the unmodified app, which only runs on Android
  (see integration_test/README.md). Start an Android emulator/device, or run
  the 'test-e2e' CI job — it provisions a hardware-accelerated emulator."
fi
log "using device: $DEVICE_ID"

# --- 7-8. Run the integration test -------------------------------------------
log "running the Flutter integration test…"
cd "$APP_DIR"
flutter pub get >/dev/null
set +e
flutter test integration_test/app_test.dart -d "$DEVICE_ID" \
  --dart-define "MAIN_API_URL=http://${E2E_API_HOST}:${BACKEND_PORT}"
test_exit=$?
set -e
if [ "$test_exit" -eq 0 ]; then
  log "integration test PASSED."
else
  log "integration test FAILED (exit $test_exit)."
fi
exit "$test_exit"
