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
#   ./e2e/run_e2e.sh [--keep-up] [--native] [--startup-attempts N]
#     --keep-up   Leave the server stack running after the run, for debugging.
#     --native    Pass through to the lifecycle (Docker-less hosts, e.g. macOS
#                 CI): the caller provisions Postgres/Redis; see ci/e2e-server.sh.
#     --startup-attempts N
#                 Retry a startup failure up to N total attempts per flow (1-4,
#                 default 1). An attempt is a startup failure only when it
#                 evaluated no assertion and stopped in a startup-phase command;
#                 every other failure is terminal. See ADR 038 and
#                 classify-maestro-attempt.mjs.
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
STARTUP_ATTEMPTS=1
while [ "$#" -gt 0 ]; do
  case "$1" in
    --keep-up) KEEP_UP=1 ;;
    --native)  NATIVE_FLAG="--native" ;;
    --startup-attempts)
      [ "$#" -ge 2 ] || { echo "run_e2e.sh: --startup-attempts requires a value" >&2; exit 2; }
      STARTUP_ATTEMPTS="$2"
      shift
      ;;
    *) echo "run_e2e.sh: unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

case "$STARTUP_ATTEMPTS" in
  1|2|3|4) ;;
  *) echo "run_e2e.sh: --startup-attempts must be an integer from 1 to 4" >&2; exit 2 ;;
esac

# --- Paths -------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MOBILE_DIR/.." && pwd)"
E2E_SERVER="${E2E_SERVER:-$REPO_ROOT/ci/e2e-server.sh}"
MAESTRO_DIR="${MAESTRO_DIR:-$MOBILE_DIR/.maestro}"
MAESTRO_LOG_ROOT="${MAESTRO_LOG_ROOT:-${HOME}/.maestro/tests/timecalendar-harness}"
# Where Maestro writes its own debug output: one
# <root>/<yyyy-MM-dd_HHmmss>/<flow>/commands.json per attempt that opened a
# flow. This is what the retry classifier reads (see is_retryable_startup_failure).
MAESTRO_DEBUG_ROOT="${MAESTRO_DEBUG_ROOT:-${HOME}/.maestro/tests}"
CLASSIFIER="${CLASSIFIER:-$SCRIPT_DIR/classify-maestro-attempt.mjs}"

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
[ -d "$MAESTRO_DIR" ] || fail "Maestro flow directory does not exist: $MAESTRO_DIR"
# The retry classifier reads Maestro's JSON command record; node is the runtime
# every mobile CI job and every mobile dev machine already has (.nvmrc).
command -v node >/dev/null 2>&1 || fail "node is not on PATH (see .nvmrc)"
[ -f "$CLASSIFIER" ] || fail "retry classifier is missing: $CLASSIFIER"

# The per-flow command record Maestro wrote for the attempt that just ran:
# $MAESTRO_DEBUG_ROOT/<yyyy-MM-dd_HHmmss>/<flow>/commands.json. `marker` is a
# file touched immediately before the attempt, so a stale record from an earlier
# attempt of the same flow can never be picked up. Prints nothing when Maestro
# never opened the flow.
latest_commands_json() {
  local flow_name="$1" marker="$2"
  [ -d "$MAESTRO_DEBUG_ROOT" ] || return 0
  find "$MAESTRO_DEBUG_ROOT" \
    -mindepth 3 -maxdepth 3 \
    -type f \
    -path "*/${flow_name}/commands.json" \
    -newer "$marker" 2>/dev/null | sort | tail -n 1
}

# ADR 038's retry rule, structural rather than signature-based. An attempt may be
# retried only when it proved nothing about the application. Three stack-trace
# signatures used to live here; each one bought one CI cycle before the next
# punctuation variant appeared, so they are collapsed into the rule below rather
# than stacked into a fourth.
is_retryable_startup_failure() {
  local flow_name="$1" marker="$2" output_file="$3" commands_json

  # The assertion guard runs first and wins outright. Assertion evidence in the
  # harness output makes the attempt terminal whatever the command record says.
  if grep -Eiq \
    'assertion failed|failed to assert|element .*not found|timeout.*(assert|element)|assert(Visible|NotVisible).*failed' \
    "$output_file"; then
    return 1
  fi

  commands_json="$(latest_commands_json "$flow_name" "$marker")"

  # No per-flow record at all: Maestro aborted during session creation, before it
  # opened the flow — the shape MAESTRO_DRIVER_STARTUP_TIMEOUT bounds, whose
  # documented remedy is relaunching the driver in a fresh process.
  if [ -z "$commands_json" ]; then
    log "flow ${flow_name}: no command record — Maestro aborted before opening the flow"
    return 0
  fi

  node "$CLASSIFIER" "$commands_json"
}

run_flow() {
  local flow="$1"
  local flow_name attempt attempt_log attempt_marker flow_exit
  flow_name="$(basename "$flow" .yaml)"
  attempt=1

  while [ "$attempt" -le "$STARTUP_ATTEMPTS" ]; do
    attempt_log="$MAESTRO_LOG_ROOT/${flow_name}-attempt-${attempt}.log"
    attempt_marker="$MAESTRO_LOG_ROOT/${flow_name}-attempt-${attempt}.started"
    log "flow ${flow_name}: attempt ${attempt}/${STARTUP_ATTEMPTS}"
    : > "$attempt_marker"
    if maestro test "$flow" 2>&1 | tee "$attempt_log"; then
      flow_exit=0
    else
      flow_exit=${PIPESTATUS[0]}
    fi

    if [ "$flow_exit" -eq 0 ]; then
      log "flow ${flow_name}: PASSED"
      return 0
    fi

    if is_retryable_startup_failure "$flow_name" "$attempt_marker" "$attempt_log"; then
      if [ "$attempt" -lt "$STARTUP_ATTEMPTS" ]; then
        log "flow ${flow_name}: retryable startup failure (no assertion evaluated); starting a fresh Maestro process"
        attempt=$((attempt + 1))
        continue
      fi
      log "flow ${flow_name}: retryable startup failure exhausted ${STARTUP_ATTEMPTS} attempt(s)"
    else
      log "flow ${flow_name}: terminal non-startup failure; not retrying"
    fi
    return "$flow_exit"
  done
}

# --- 1. Boot + seed the backend via the shared lifecycle ---------------------
log "booting the e2e server stack (ci/e2e-server.sh up $NATIVE_FLAG)…"
# shellcheck disable=SC2086  # NATIVE_FLAG is intentionally word-split (may be empty)
"$E2E_SERVER" up $NATIVE_FLAG

# --- 2. Run the Maestro flows against the connected device -------------------
# Maestro auto-detects the single running simulator/emulator. The flows assert
# stable seeded text, so the same YAML runs on both platforms.
log "running each top-level Maestro flow in a fresh process (${MAESTRO_DIR})…"
mkdir -p "$MAESTRO_LOG_ROOT"
flow_exit=0
flow_count=0
# Shell glob expansion is lexical under C locale and remains compatible with
# macOS Bash 3.2. Nested YAML files are intentionally excluded.
export LC_ALL=C
for flow in "$MAESTRO_DIR"/*.yaml; do
  [ -e "$flow" ] || fail "no top-level Maestro YAML files found in $MAESTRO_DIR"
  flow_count=$((flow_count + 1))
  if run_flow "$flow"; then
    :
  else
    flow_exit=$?
    break
  fi
done
log "executed ${flow_count} top-level flow(s)."

# --- 3. Report --------------------------------------------------------------
if [ "$flow_exit" -eq 0 ]; then
  log "all Maestro flows PASSED."
else
  log "Maestro flow FAILED (exit $flow_exit); later flows were not run."
  # Dump the backend log so a server-side error behind a flow failure shows up.
  log "----- backend log (tail) -----"
  # shellcheck disable=SC2086  # NATIVE_FLAG is intentionally word-split (may be empty)
  "$E2E_SERVER" logs $NATIVE_FLAG 2>/dev/null | tail -n 120 >&2 || true
  log "----- end backend log -----"
fi
exit "$flow_exit"
