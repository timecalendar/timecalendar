#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOW="$REPO_ROOT/.github/workflows/ci-mobile-e2e.yml"
MOBILE_WORKFLOW="$REPO_ROOT/.github/workflows/ci-mobile.yml"

fail() {
  echo "[test_ci_mobile_e2e] FAIL: $*" >&2
  exit 1
}

assert_count() {
  local expected="$1" pattern="$2" actual
  actual="$(grep -Fc -- "$pattern" "$WORKFLOW" || true)"
  [ "$actual" -eq "$expected" ] || \
    fail "expected $expected occurrence(s) of '$pattern', got $actual"
}

assert_present() {
  grep -Fq -- "$1" "$WORKFLOW" || fail "missing workflow invariant: $1"
}

assert_absent() {
  ! grep -Fq -- "$1" "$WORKFLOW" || fail "forbidden workflow pattern remains: $1"
}

assert_count 2 'export MAESTRO_VERSION=2.8.0'
assert_count 2 'maestro --version'
assert_present 'Xcode developer directory: $(xcode-select -p)'
assert_present 'xcrun simctl list runtimes available'
assert_present 'Selected simulator: name=$DEVICE_NAME udid=$DEVICE_UDID runtime=$DEVICE_RUNTIME'
assert_present '--no-daemon'
assert_present '--max-workers=2'
assert_present '-Xmx3072m -XX:MaxMetaspaceSize=1024m'
assert_present './mobile/e2e/run_e2e.sh --native --startup-attempts 4'
assert_absent 'for attempt in 1 2 3 4'
assert_present 'name: maestro-debug-android'
assert_present 'name: maestro-debug-ios'
assert_present 'name: e2e-server-logs-android'
assert_present 'name: e2e-server-logs-ios'
grep -Fq -- './mobile/e2e/test_run_e2e.sh' "$MOBILE_WORKFLOW" || \
  fail 'standard mobile CI does not run the deterministic E2E harness regression'

echo '[test_ci_mobile_e2e] PASS'
