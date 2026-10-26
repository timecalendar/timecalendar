#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUIESCE="$SCRIPT_DIR/quiesce-ios-simulator.sh"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/timecalendar-quiesce.XXXXXX")"
trap 'rm -rf "$TEST_ROOT"' EXIT

fail() {
  echo "[test_quiesce_ios_simulator] FAIL: $*" >&2
  exit 1
}

mkdir -p "$TEST_ROOT/bin"
cat > "$TEST_ROOT/bin/xcrun" <<'SH'
#!/usr/bin/env bash
echo "$*" >> "$CALL_LOG"
case "$*" in
  "simctl bootstatus "*" -b") exit 0 ;;
  "simctl spawn "*" launchctl disable user/foreground/com.apple.apsd") exit "${FAKE_DISABLE_STATUS:-0}" ;;
  "simctl spawn "*" launchctl bootout user/foreground/com.apple.apsd") exit "${FAKE_BOOTOUT_STATUS:-0}" ;;
  "simctl spawn "*" launchctl list")
    printf 'PID\tStatus\tLabel\n'
    printf -- '-\t0\tcom.apple.notifyd\n'
    printf -- '123\t0\tcom.apple.storekitd\n'
    printf -- '-\t0\tcom.apple.apsd.lookalike\n'
    [ "${FAKE_APSD_LISTED:-0}" != 1 ] || printf -- '-\t0\tcom.apple.apsd\n'
    exit "${FAKE_LIST_STATUS:-0}"
    ;;
esac
exit 97
SH
chmod +x "$TEST_ROOT/bin/xcrun"
export PATH="$TEST_ROOT/bin:$PATH"

case_index=0

run_case() {
  case_index=$((case_index + 1))
  case_dir="$TEST_ROOT/case-$case_index"
  mkdir -p "$case_dir"
  export CALL_LOG="$case_dir/calls"
  : > "$CALL_LOG"
  status=0
  env "$@" "$QUIESCE" ${QUIESCE_ARGS[@]+"${QUIESCE_ARGS[@]}"} > "$case_dir/stdout" 2> "$case_dir/stderr" || status=$?
}

test_happy_path() {
  QUIESCE_ARGS=(U)
  run_case
  [ "$status" -eq 0 ] || fail "happy path exited $status: $(cat "$case_dir/stderr")"
  local expected
  expected="simctl bootstatus U -b
simctl spawn U launchctl disable user/foreground/com.apple.apsd
simctl spawn U launchctl bootout user/foreground/com.apple.apsd
simctl spawn U launchctl list"
  [ "$(cat "$CALL_LOG")" = "$expected" ] || fail "unexpected call order:"$'\n'"$(cat "$CALL_LOG")"
  grep -Fq 'apsd disabled in simulator U' "$case_dir/stdout" || fail 'happy path printed no evidence line'
}

test_bootout_failure_tolerated() {
  QUIESCE_ARGS=(U)
  run_case FAKE_BOOTOUT_STATUS=3
  [ "$status" -eq 0 ] || fail "a failed bootout must be tolerated, exited $status"
}

test_apsd_still_listed() {
  QUIESCE_ARGS=(U)
  run_case FAKE_APSD_LISTED=1
  [ "$status" -ne 0 ] || fail 'a still-loaded apsd must fail the script'
  grep -Fq 'apsd is still loaded in simulator U' "$case_dir/stderr" || fail 'still-loaded apsd printed no error'
}

test_disable_failure_fatal() {
  QUIESCE_ARGS=(U)
  run_case FAKE_DISABLE_STATUS=5
  [ "$status" -ne 0 ] || fail 'a failed disable must fail the script'
  ! grep -Eq 'bootout|list' "$CALL_LOG" || fail "a failed disable must stop the script:"$'\n'"$(cat "$CALL_LOG")"
}

test_list_failure_fatal() {
  QUIESCE_ARGS=(U)
  run_case FAKE_LIST_STATUS=4
  [ "$status" -ne 0 ] || fail 'a failed launchctl list must fail the script'
  ! grep -Fq 'apsd disabled' "$case_dir/stdout" || fail 'a failed launchctl list must not report apsd disabled'
}

test_missing_udid() {
  QUIESCE_ARGS=()
  run_case
  [ "$status" -eq 2 ] || fail "no argument must exit 2, got $status"
  [ ! -s "$CALL_LOG" ] || fail 'no argument must not call xcrun'

  QUIESCE_ARGS=('')
  run_case
  [ "$status" -eq 2 ] || fail "an empty argument must exit 2, got $status"
  [ ! -s "$CALL_LOG" ] || fail 'an empty argument must not call xcrun'
}

test_happy_path
test_bootout_failure_tolerated
test_apsd_still_listed
test_disable_failure_fatal
test_list_failure_fatal
test_missing_udid

echo '[test_quiesce_ios_simulator] PASS'
