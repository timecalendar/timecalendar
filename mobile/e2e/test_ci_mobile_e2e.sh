#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOW="$REPO_ROOT/.github/workflows/ci-mobile-e2e.yml"
BASELINE_WORKFLOW="$REPO_ROOT/.github/workflows/ci-mobile.yml"

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

assert_step_contract() {
  local step_name="$1" expected_url="$2" forbidden_url="$3" block pattern actual
  block="$(awk -v target="$step_name" '
    $0 == "      - name: " target { inside = 1 }
    inside && seen && /^      - name:/ { exit }
    inside { print; seen = 1 }
  ' "$WORKFLOW")"
  [ -n "$block" ] || fail "missing workflow step: $step_name"

  for pattern in \
    'APP_VARIANT: development' \
    'BACKEND_ENVIRONMENT_CAPABILITY: development' \
    "EXPO_PUBLIC_API_URL: $expected_url"; do
    actual="$(grep -Fc -- "$pattern" <<< "$block" || true)"
    [ "$actual" -eq 1 ] || \
      fail "expected exactly one '$pattern' in step '$step_name', got $actual"
  done

  ! grep -Fq -- "EXPO_PUBLIC_API_URL: $forbidden_url" <<< "$block" || \
    fail "step '$step_name' contains the opposite platform URL: $forbidden_url"
}

assert_step_contract \
  'Prebuild Android (dev variant)' \
  'http://10.0.2.2:3005' \
  'http://localhost:3005'
assert_step_contract \
  'Build release APK' \
  'http://10.0.2.2:3005' \
  'http://localhost:3005'
assert_step_contract \
  'Prebuild iOS (dev variant)' \
  'http://localhost:3005' \
  'http://10.0.2.2:3005'
assert_step_contract \
  'Build Release simulator app' \
  'http://localhost:3005' \
  'http://10.0.2.2:3005'

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

# The guard above only guards anything if it runs. The native jobs that invoke it
# are label-gated on pull requests, so a PR editing ci-mobile-e2e.yml alone would
# run neither gate and land the break on main. The baseline mobile workflow must
# therefore watch that file and run both proofs itself.
assert_baseline() {
  grep -Fq -- "$1" "$BASELINE_WORKFLOW" || \
    fail "ci-mobile.yml is missing the E2E-contract invariant: $1"
}

assert_baseline "- '.github/workflows/ci-mobile-e2e.yml'"
assert_baseline './mobile/e2e/test_run_e2e.sh'
assert_baseline './mobile/e2e/test_ci_mobile_e2e.sh'

echo '[test_ci_mobile_e2e] PASS'
