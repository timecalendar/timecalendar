#!/usr/bin/env bash
#
# run_e2e.sh — single-command end-to-end harness for the mobile app.
#
# Brings up the NestJS backend + Postgres/Redis (seeded with deterministic
# fixtures in the isolated `timecalendar_test` database) via the shared,
# compose-first lifecycle `ci/e2e-server.sh`, runs the Maestro flows against the
# connected simulator/emulator, and tears everything down (on success *and*
# failure).
#
# This script owns only the Maestro-specific half. The server half — boot, seed,
# dummy Firebase key, readiness, teardown, logs — is the shared lifecycle's job
# (same one the Flutter harness uses). It does NOT build or install the app: a
# release-config dev-variant build must already be installed on the connected
# device, with EXPO_PUBLIC_API_URL baked to the platform-correct host
# (http://10.0.2.2:3005 on Android, http://localhost:3005 on iOS). See
# mobile/e2e/README.md.
#
# Usage:
#   ./e2e/run_e2e.sh [--keep-up] [--native]
#     --keep-up   Leave the server stack running after the run, for debugging.
#     --native    Pass through to the lifecycle (Docker-less hosts, e.g. macOS
#                 CI): the caller provisions Postgres/Redis; see ci/e2e-server.sh.
#
# Prerequisites and CI notes: see e2e/README.md.

set -euo pipefail

# --- Arguments ---------------------------------------------------------------
# NATIVE_FLAG is a plain string (not an array) so it is safe to expand unquoted
# under `set -u` on macOS's bash 3.2, where an empty array `"${arr[@]}"` errors
# with "unbound variable". It holds at most "--native" (no spaces), so unquoted
# word-splitting yields 0 or 1 arg — the same idiom ci/e2e-server.sh uses.
KEEP_UP=0
NATIVE_FLAG=""
for arg in "$@"; do
  case "$arg" in
    --keep-up) KEEP_UP=1 ;;
    --native)  NATIVE_FLAG="--native" ;;
    *) echo "run_e2e.sh: unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# --- Paths -------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MOBILE_DIR/.." && pwd)"
E2E_SERVER="$REPO_ROOT/ci/e2e-server.sh"
MAESTRO_DIR="$MOBILE_DIR/.maestro"

log()  { echo "[run_e2e] $*"; }
fail() { echo "[run_e2e] ERROR: $*" >&2; exit 1; }

# --- Teardown (runs on every exit) -------------------------------------------
teardown() {
  local code=$?
  if [ "$KEEP_UP" -eq 1 ]; then
    log "--keep-up set: leaving the server stack up."
    log "server logs:  $E2E_SERVER logs $NATIVE_FLAG"
    log "tear down:    $E2E_SERVER down $NATIVE_FLAG"
    exit "$code"
  fi
  log "tearing down the server stack…"
  # shellcheck disable=SC2086  # NATIVE_FLAG is intentionally word-split (may be empty)
  "$E2E_SERVER" down $NATIVE_FLAG >/dev/null 2>&1 || true
  exit "$code"
}
trap teardown EXIT

# --- Preflight ---------------------------------------------------------------
command -v maestro >/dev/null 2>&1 || fail \
  "maestro is not on PATH. Install it with:
    curl -fsSL https://get.maestro.mobile.dev | bash
  (Maestro is JVM-based and needs a JDK on PATH.)"

# --- 1. Boot + seed the backend via the shared lifecycle ---------------------
log "booting the e2e server stack (ci/e2e-server.sh up $NATIVE_FLAG)…"
# shellcheck disable=SC2086  # NATIVE_FLAG is intentionally word-split (may be empty)
"$E2E_SERVER" up $NATIVE_FLAG

# --- 2. Run the Maestro flows against the connected device -------------------
# Maestro auto-detects the single running simulator/emulator. The flows assert
# stable seeded text, so the same YAML runs on both platforms.
log "running Maestro flows in $MAESTRO_DIR…"
set +e
maestro test "$MAESTRO_DIR"
flow_exit=$?
set -e

# --- 3. Report --------------------------------------------------------------
if [ "$flow_exit" -eq 0 ]; then
  log "all Maestro flows PASSED."
else
  log "one or more Maestro flows FAILED (exit $flow_exit)."
  # Dump the backend log so a server-side error behind a flow failure shows up.
  log "----- backend log (tail) -----"
  # shellcheck disable=SC2086  # NATIVE_FLAG is intentionally word-split (may be empty)
  "$E2E_SERVER" logs $NATIVE_FLAG 2>/dev/null | tail -n 120 >&2 || true
  log "----- end backend log -----"
fi
exit "$flow_exit"
