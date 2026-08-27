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
  ios_driver_timeout_then_pass)
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      echo 'IOSDriverTimeoutException: iOS driver not ready in time' >&2
      exit 44
    fi
    exit 0
    ;;
  ios_driver_timeout_exhausted)
    echo 'IOSDriverTimeoutException: iOS driver not ready in time' >&2
    exit 44
    ;;
  ios_driver_timeout_assertion)
    echo 'IOSDriverTimeoutException: iOS driver not ready in time; Assertion failed: assertVisible element not found' >&2
    exit 45
    ;;
  assertion)
    if [ "$flow" = alpha ]; then
      echo 'launchApp completed; Assertion failed: assertVisible element not found' >&2
      exit 37
    fi
    exit 0
    ;;
  sigsegv_then_pass)
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      echo 'Assertion failed: assertVisible Calendar' >&2
      exit 43
    fi
    exit 0
    ;;
  sigsegv_exhausted)
    echo 'Assertion failed: assertVisible Calendar' >&2
    exit 43
    ;;
  seeded_data)
    echo 'Element E2E Today Lecture not found' >&2
    exit 38
    ;;
  server_failure)
    echo 'POST /calendars/sync returned 500' >&2
    exit 39
    ;;
  unknown|stale|prior_attempt|other_flow|other_process|log_unavailable)
    echo 'Unexpected Maestro failure' >&2
    exit 40
    ;;
esac
SH
  chmod +x "$fixture/bin/maestro"

  cat > "$fixture/bin/xcrun" <<'SH'
#!/usr/bin/env bash
echo "xcrun:$*" >> "$CALL_LOG"

if [ "$SCENARIO" = log_unavailable ]; then
  exit 1
fi

if [ "$1 $2 $3 $4 $5" = 'simctl list devices booted -j' ]; then
  echo '{"devices":{"com.apple.CoreSimulator.SimRuntime.iOS-26-5":[{"state":"Booted"}]}}'
  exit 0
fi

if [ "$1 $2 $3 $4 $5" = 'simctl spawn booted log show' ]; then
  case "$SCENARIO" in
    sigsegv_then_pass|sigsegv_exhausted)
      echo 'runningboardd: [app<fr.samuelprak.timecalendar.dev((null))>:91525] exited with context code:SIGSEGV(11)'
      ;;
    other_process)
      echo 'runningboardd: [app<com.example.other((null))>:91525] exited with context code:SIGSEGV(11)'
      ;;
  esac
  exit 0
fi

exit 1
SH
  chmod +x "$fixture/bin/xcrun"
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

fixture="$(make_fixture ios_driver_timeout_then_pass)"
run_fixture "$fixture" ios_driver_timeout_then_pass 0 --startup-attempts 2
assert_count 2 '^alpha:' "$fixture/calls"
assert_count 1 '^beta:' "$fixture/calls"

fixture="$(make_fixture ios_driver_timeout_exhausted)"
run_fixture "$fixture" ios_driver_timeout_exhausted 44 --startup-attempts 2
assert_count 2 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"

fixture="$(make_fixture ios_driver_timeout_assertion)"
run_fixture "$fixture" ios_driver_timeout_assertion 45 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"

fixture="$(make_fixture assertion)"
run_fixture "$fixture" assertion 37 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"
assert_count 1 '^logs$' "$fixture/calls"
assert_count 1 '^down$' "$fixture/calls"

fixture="$(make_fixture sigsegv_then_pass)"
run_fixture "$fixture" sigsegv_then_pass 0 --startup-attempts 2
assert_count 2 '^alpha:' "$fixture/calls"
assert_count 1 '^beta:' "$fixture/calls"
assert_count 1 '^xcrun:simctl spawn booted log show --start ' "$fixture/calls"
grep -Eq 'app<fr\.samuelprak\.timecalendar\.dev.*SIGSEGV\(11\)' \
  "$fixture/logs/alpha-attempt-1-simulator.log" || fail 'qualifying SIGSEGV artifact was not persisted'

fixture="$(make_fixture sigsegv_exhausted)"
run_fixture "$fixture" sigsegv_exhausted 43 --startup-attempts 2
assert_count 2 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"
assert_count 2 '^xcrun:simctl spawn booted log show --start ' "$fixture/calls"

fixture="$(make_fixture seeded_data)"
run_fixture "$fixture" seeded_data 38 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"

fixture="$(make_fixture server_failure)"
run_fixture "$fixture" server_failure 39 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"

fixture="$(make_fixture unknown)"
run_fixture "$fixture" unknown 40 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"

fixture="$(make_fixture stale)"
printf '%s\n' \
  'runningboardd: [app<fr.samuelprak.timecalendar.dev((null))>:1] code:SIGSEGV(11)' \
  > "$fixture/logs/alpha-attempt-1-simulator.log"
run_fixture "$fixture" stale 40 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 'SIGSEGV(11)' "$fixture/logs/alpha-attempt-1-simulator.log"

fixture="$(make_fixture prior_attempt)"
printf '%s\n' \
  'runningboardd: [app<fr.samuelprak.timecalendar.dev((null))>:1] code:SIGSEGV(11)' \
  > "$fixture/logs/alpha-attempt-0-simulator.log"
run_fixture "$fixture" prior_attempt 40 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"

fixture="$(make_fixture other_flow)"
printf '%s\n' \
  'runningboardd: [app<fr.samuelprak.timecalendar.dev((null))>:1] code:SIGSEGV(11)' \
  > "$fixture/logs/beta-attempt-1-simulator.log"
run_fixture "$fixture" other_flow 40 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"

fixture="$(make_fixture other_process)"
run_fixture "$fixture" other_process 40 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"

fixture="$(make_fixture log_unavailable)"
run_fixture "$fixture" log_unavailable 40 --startup-attempts 4
assert_count 1 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"

echo '[test_run_e2e] PASS'
