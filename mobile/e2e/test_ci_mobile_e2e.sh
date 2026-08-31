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

assert_job_backend_capability() {
  local job="$1" job_block job_env capability_count job_capability_count

  job_block="$(awk -v job="$job" '
    $0 == "  " job ":" { in_job = 1 }
    in_job && $0 ~ /^  [[:alnum:]_-]+:$/ && $0 != "  " job ":" { exit }
    in_job { print }
  ' "$WORKFLOW")"
  [ -n "$job_block" ] || fail "missing workflow job: $job"

  job_env="$(awk '
    /^    env:$/ { in_env = 1; next }
    in_env && /^    [[:alnum:]_-]+:/ { exit }
    in_env { print }
  ' <<< "$job_block")"
  capability_count="$(grep -Ec \
    '^      BACKEND_ENVIRONMENT_CAPABILITY: development([[:space:]]*(#.*)?)?$' \
    <<< "$job_env" || true)"
  job_capability_count="$(grep -Ec \
    '^[[:space:]]+BACKEND_ENVIRONMENT_CAPABILITY:' \
    <<< "$job_block" || true)"

  [ "$capability_count" -eq 1 ] && [ "$job_capability_count" -eq 1 ] || \
    fail "$job must declare exactly one job-level BACKEND_ENVIRONMENT_CAPABILITY: development"
}

assert_job_backend_capability 'e2e-mobile-android'
assert_job_backend_capability 'e2e-mobile-ios'
assert_count 2 'BACKEND_ENVIRONMENT_CAPABILITY: development'
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
