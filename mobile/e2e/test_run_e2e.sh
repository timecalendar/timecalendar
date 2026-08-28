#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS="$SCRIPT_DIR/run_e2e.sh"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/timecalendar-e2e-harness.XXXXXX")"
trap 'rm -rf "$TEST_ROOT"' EXIT

fail() {
  echo "[test_run_e2e] FAIL: $*" >&2
  exit 1
}

assert_count() {
  local expected="$1" pattern="$2" file="$3" actual
  actual="$(grep -c "$pattern" "$file" || true)"
  [ "$actual" -eq "$expected" ] || \
    fail "expected $expected occurrence(s) of '$pattern' in $file, got $actual"
}

make_fixture() {
  local scenario="$1"
  local fixture="$TEST_ROOT/$scenario"
  mkdir -p "$fixture/bin" "$fixture/flows" "$fixture/logs" "$fixture/state"
  printf '%s\n' 'appId: test' '---' '- launchApp' > "$fixture/flows/alpha.yaml"
  printf '%s\n' 'appId: test' '---' '- launchApp' > "$fixture/flows/beta.yaml"

  cat > "$fixture/server" <<'SH'
#!/usr/bin/env bash
echo "$1" >> "$CALL_LOG"
SH
  chmod +x "$fixture/server"

  cat > "$fixture/bin/maestro" <<'SH'
#!/usr/bin/env bash
flow="$(basename "$2" .yaml)"
count_file="$STATE_DIR/$flow"
count=0
[ ! -f "$count_file" ] || count="$(cat "$count_file")"
count=$((count + 1))
echo "$count" > "$count_file"
echo "$flow:$count" >> "$CALL_LOG"

case "$SCENARIO" in
  pass) exit 0 ;;
  retry_then_pass)
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      echo 'launchApp setPermissions: XCTest driver is not listening' >&2
      exit 42
    fi
    exit 0
    ;;
  retry_exhausted)
    echo 'launchApp setPermissions: java.net.ConnectException: Connection refused' >&2
    exit 42
    ;;
  driver_timeout)
    # The driver never bound its port, so Maestro aborts before it opens the
    # flow: the output names no flow command at all.
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      echo 'iOS driver not ready in time, consider increasing timeout by configuring MAESTRO_DRIVER_STARTUP_TIMEOUT env variable' >&2
      echo 'xcuitest.installer.LocalXCTestInstaller$IOSDriverTimeoutException' >&2
      exit 42
    fi
    exit 0
    ;;
  assertion)
    if [ "$flow" = alpha ]; then
      echo 'launchApp completed; Assertion failed: assertVisible element not found' >&2
      exit 37
    fi
    exit 0
    ;;
esac
SH
  chmod +x "$fixture/bin/maestro"
  echo "$fixture"
}

run_fixture() {
  local fixture="$1" scenario="$2" expected="$3"
  shift 3
  set +e
  PATH="$fixture/bin:$PATH" \
    E2E_SERVER="$fixture/server" \
    MAESTRO_DIR="$fixture/flows" \
    MAESTRO_LOG_ROOT="$fixture/logs" \
    STATE_DIR="$fixture/state" \
    CALL_LOG="$fixture/calls" \
    SCENARIO="$scenario" \
    "$HARNESS" "$@" > "$fixture/output" 2>&1
  status=$?
  set -e
  [ "$status" -eq "$expected" ] || \
    fail "$scenario returned $status instead of $expected; output: $(cat "$fixture/output")"
}

fixture="$(make_fixture pass)"
run_fixture "$fixture" pass 0
[ "$(sed -n '2p' "$fixture/calls")" = 'alpha:1' ] || fail 'flows were not lexically ordered'
[ "$(sed -n '3p' "$fixture/calls")" = 'beta:1' ] || fail 'all top-level flows were not enumerated'
assert_count 1 '^up$' "$fixture/calls"
assert_count 1 '^down$' "$fixture/calls"

fixture="$(make_fixture retry_then_pass)"
run_fixture "$fixture" retry_then_pass 0 --startup-attempts 2
assert_count 2 '^alpha:' "$fixture/calls"
assert_count 1 '^beta:' "$fixture/calls"
assert_count 1 '^up$' "$fixture/calls"
assert_count 1 '^down$' "$fixture/calls"

fixture="$(make_fixture retry_exhausted)"
run_fixture "$fixture" retry_exhausted 42 --startup-attempts 2
assert_count 2 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"
assert_count 1 '^logs$' "$fixture/calls"
assert_count 1 '^down$' "$fixture/calls"

fixture="$(make_fixture driver_timeout)"
run_fixture "$fixture" driver_timeout 0 --startup-attempts 2
assert_count 2 '^alpha:' "$fixture/calls"
assert_count 1 '^beta:' "$fixture/calls"
grep -q 'retryable XCTest driver-startup failure' "$fixture/output" || \
  fail 'a pre-flow iOS driver-startup timeout was not classified as retryable'

fixture="$(make_fixture assertion)"
run_fixture "$fixture" assertion 37 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"
assert_count 1 '^logs$' "$fixture/calls"
assert_count 1 '^down$' "$fixture/calls"

echo '[test_run_e2e] PASS'
