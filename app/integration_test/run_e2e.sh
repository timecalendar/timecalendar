#!/usr/bin/env bash
#
# run_e2e.sh — single-command end-to-end smoke harness for TimeCalendar.
#
# Brings up the NestJS backend + Postgres/Redis (seeded with deterministic
# fixtures in the isolated `timecalendar_test` database), runs the Flutter E2E
# smoke flows against the live backend, and tears everything down (on success
# *and* failure).
#
# The server half — boot, seed, dummy Firebase key, readiness, teardown, logs —
# is owned by the shared, compose-first lifecycle `ci/e2e-server.sh` (Docker is
# the lifecycle manager). This script owns only the Flutter-specific half:
# device resolution, the per-flow `flutter test` loop, and result reporting.
#
# Each `integration_test/*_flow_test.dart` file is one flow and is run as its
# own `flutter test` process: `app.main()` calls `Firebase.initializeApp`,
# which throws `[core/duplicate-app]` on a second call in the same process, so
# process-per-flow is what keeps the flows isolated (see README.md /
# openspec/changes/nominal-e2e-flows/design.md, Decision 1). The script exits
# non-zero if any flow fails, and reports per-flow pass/fail.
#
# Usage:
#   ./integration_test/run_e2e.sh [--keep-up]
#     --keep-up   Leave the backend + Docker containers running after the test,
#                 for debugging. Default is to tear down.
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
E2E_SERVER="$REPO_ROOT/ci/e2e-server.sh"

# --- Config ------------------------------------------------------------------
BACKEND_PORT=3005
# Host the Flutter app uses to reach the backend. 10.0.2.2 is the host loopback
# as seen from an Android emulator; override for a physical device.
E2E_API_HOST="${E2E_API_HOST:-10.0.2.2}"
# Wall-clock cap on each per-flow `flutter test`. Each flow carries its own
# per-test timeout (see the `*_flow_test.dart` files), so this only fires if
# the tool hangs *outside* a test (e.g. it fails to exit after the run
# completes). Keeps a hang well inside the CI job's own timeout.
E2E_TEST_TIMEOUT="${E2E_TEST_TIMEOUT:-720}"

log()  { echo "[run_e2e] $*"; }
fail() { echo "[run_e2e] ERROR: $*" >&2; exit 1; }

# --- Teardown (runs on every exit) -------------------------------------------
teardown() {
  local code=$?
  if [ "$KEEP_UP" -eq 1 ]; then
    log "--keep-up set: leaving the server stack up."
    log "server logs:  $E2E_SERVER logs"
    log "tear down:    $E2E_SERVER down"
    exit "$code"
  fi
  log "tearing down the server stack…"
  "$E2E_SERVER" down >/dev/null 2>&1 || true
  exit "$code"
}
trap teardown EXIT

# --- Preflight ---------------------------------------------------------------
command -v docker  >/dev/null 2>&1 || fail "docker is not installed."
command -v flutter >/dev/null 2>&1 || fail \
  "flutter is not on PATH. The SDK is not on PATH by default — run:
    export PATH=\"/home/dev/flutter/bin:\$PATH\""
command -v python3 >/dev/null 2>&1 || fail "python3 is not installed."

# --- 1. Boot + seed the backend via the shared lifecycle ---------------------
# `up` ensures the dummy Firebase key, brings Postgres/Redis/server up healthy
# (compose --wait gated on /health), and seeds timecalendar_test. Everything the
# old inline bash hand-rolled (process-group boot, readiness polling, log files)
# is Docker's job now.
log "booting the e2e server stack (ci/e2e-server.sh up)…"
"$E2E_SERVER" up

# --- 2. Resolve an Android target device ------------------------------------
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

# --- 3. Run every flow file, each in its own process -------------------------
cd "$APP_DIR"
flutter pub get >/dev/null

# One flow per file: `app.main()` calls `Firebase.initializeApp`, which throws
# `[core/duplicate-app]` on a second call in the same process — so each file is
# a separate `flutter test` invocation = a fresh process.
FLOW_FILES=()
while IFS= read -r flow; do
  FLOW_FILES+=("$flow")
done < <(find integration_test -maxdepth 1 -name '*_flow_test.dart' | sort)

if [ "${#FLOW_FILES[@]}" -eq 0 ]; then
  fail "no integration_test/*_flow_test.dart files found."
fi
log "found ${#FLOW_FILES[@]} flow file(s): ${FLOW_FILES[*]}"

overall_exit=0
declare -a FLOW_RESULTS=()
for flow in "${FLOW_FILES[@]}"; do
  log "running flow '$flow' (timeout ${E2E_TEST_TIMEOUT}s)…"
  # `--reporter expanded` prints every test's start/pass/fail on its own line,
  # so a CI log shows exactly which test is running if the run stalls.
  # `timeout` is the backstop for a tool-level hang; --kill-after sends KILL if
  # `flutter test` ignores the initial TERM.
  set +e
  timeout --kill-after=30s "${E2E_TEST_TIMEOUT}s" \
    flutter test "$flow" -d "$DEVICE_ID" \
      --reporter expanded \
      --dart-define "MAIN_API_URL=http://${E2E_API_HOST}:${BACKEND_PORT}"
  test_exit=$?
  set -e
  if [ "$test_exit" -eq 0 ]; then
    log "flow '$flow' PASSED."
    FLOW_RESULTS+=("PASS  $flow")
  elif [ "$test_exit" -eq 124 ] || [ "$test_exit" -eq 137 ]; then
    log "flow '$flow' TIMED OUT after ${E2E_TEST_TIMEOUT}s — 'flutter test'"
    log "did not exit. Treating as failure (exit $test_exit)."
    FLOW_RESULTS+=("FAIL  $flow (timeout)")
    overall_exit=1
  else
    log "flow '$flow' FAILED (exit $test_exit)."
    FLOW_RESULTS+=("FAIL  $flow (exit $test_exit)")
    overall_exit=1
  fi
done

log "----- flow results -----"
for result in "${FLOW_RESULTS[@]}"; do
  log "  $result"
done
if [ "$overall_exit" -eq 0 ]; then
  log "all flows PASSED."
else
  log "one or more flows FAILED."
  # Dump the backend log so a server-side error (e.g. a failed
  # POST /calendars/sync) behind a flow failure is visible in the CI log.
  log "----- backend log (tail) -----"
  "$E2E_SERVER" logs 2>/dev/null | tail -n 120 >&2 || true
  log "----- end backend log -----"
fi
exit "$overall_exit"
