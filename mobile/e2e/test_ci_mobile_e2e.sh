#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOW="$REPO_ROOT/.github/workflows/ci-mobile-e2e.yml"
MOBILE_WORKFLOW="$REPO_ROOT/.github/workflows/ci-mobile.yml"
WORKSPACE_RESOLVER="$SCRIPT_DIR/resolve_ios_workspace.sh"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/timecalendar-ios-workspace-test.XXXXXX")"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

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

assert_before() {
  local first="$1" second="$2" first_line second_line
  first_line="$(grep -Fn -- "$first" "$WORKFLOW" | head -n1 | cut -d: -f1)"
  second_line="$(grep -Fn -- "$second" "$WORKFLOW" | head -n1 | cut -d: -f1)"
  [ -n "$first_line" ] && [ -n "$second_line" ] && [ "$first_line" -lt "$second_line" ] || \
    fail "expected '$first' before '$second'"
}

assert_count 2 'export MAESTRO_VERSION=2.8.0'
assert_count 2 'maestro --version'
assert_present 'types: [opened, synchronize, reopened, labeled]'
assert_present 'needs: build-server'
assert_count 3 'name: Checkout exact source SHA'
assert_count 3 'ref: ${{ env.E2E_SOURCE_SHA }}'
assert_count 1 'E2E_SOURCE_SHA: ${{ github.event.pull_request.head.sha || github.sha }}'
assert_count 3 'ghcr.io/timecalendar/timecalendar:${{ env.E2E_SOURCE_SHA }}'
assert_present 'Xcode developer directory: $(xcode-select -p)'
assert_present 'xcrun simctl list runtimes available'
assert_present 'Selected simulator: name=$DEVICE_NAME udid=$DEVICE_UDID runtime=$DEVICE_RUNTIME'
assert_present '--no-daemon'
assert_present '--max-workers=2'
assert_present '-Xmx3072m -XX:MaxMetaspaceSize=1024m'
assert_present 'npx expo prebuild --platform ios --clean --no-install'
assert_present 'name: Install CocoaPods explicitly'
assert_present 'run: ../e2e/install_ios_pods.sh'
assert_present 'WORKSPACE="$(../e2e/resolve_ios_workspace.sh)"'
assert_present '-configuration Release'
assert_present 'xcrun simctl install "$DEVICE_UDID" "$APP"'
assert_present './mobile/e2e/run_e2e.sh --native --startup-attempts 4'
assert_absent 'for attempt in 1 2 3 4'
assert_absent 'WORKSPACE="$(ls -d *.xcworkspace | head -n1)"'
assert_count 5 'APP_VARIANT: development'
assert_count 3 'BACKEND_ENVIRONMENT_CAPABILITY: development'
assert_present 'EXPO_PUBLIC_API_URL: http://localhost:3005'
assert_present './ci/e2e-server.sh logs --native'
assert_present 'name: maestro-debug-android'
assert_present 'name: maestro-debug-ios'
assert_present 'name: e2e-server-logs-android'
assert_present 'name: e2e-server-logs-ios'
assert_before 'WORKSPACE="$(../e2e/resolve_ios_workspace.sh)"' 'xcodebuild \'
assert_before 'xcodebuild \' 'xcrun simctl install "$DEVICE_UDID" "$APP"'
assert_before 'xcrun simctl install "$DEVICE_UDID" "$APP"' './mobile/e2e/run_e2e.sh --native --startup-attempts 4'
grep -Fq -- './mobile/e2e/test_run_e2e.sh' "$MOBILE_WORKFLOW" || \
  fail 'standard mobile CI does not run the deterministic E2E harness regression'

mkdir -p "$TEST_ROOT/one/TimeCalendarDev.xcworkspace"
[ "$("$WORKSPACE_RESOLVER" "$TEST_ROOT/one")" = 'TimeCalendarDev.xcworkspace' ] || \
  fail 'single workspace was not resolved exactly'

if "$WORKSPACE_RESOLVER" "$TEST_ROOT/zero" >/dev/null 2>&1; then
  fail 'zero-workspace fixture did not fail'
fi

mkdir -p "$TEST_ROOT/multiple/First.xcworkspace" "$TEST_ROOT/multiple/Second.xcworkspace"
if "$WORKSPACE_RESOLVER" "$TEST_ROOT/multiple" >/dev/null 2>&1; then
  fail 'multiple-workspace fixture did not fail'
fi

"$SCRIPT_DIR/test_install_ios_pods.sh"

echo '[test_ci_mobile_e2e] PASS'
