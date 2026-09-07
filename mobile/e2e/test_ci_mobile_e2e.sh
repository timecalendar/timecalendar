#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOW="${WORKFLOW:-$REPO_ROOT/.github/workflows/ci-mobile-e2e.yml}"
BASELINE_WORKFLOW="$REPO_ROOT/.github/workflows/ci-mobile.yml"
RUN_MUTATIONS="${RUN_MUTATIONS:-1}"

fail() {
  echo "[test_ci_mobile_e2e] FAIL: $*" >&2
  exit 1
}

assert_count() {
  local expected="$1" pattern="$2" file="${3:-$WORKFLOW}" actual
  actual="$(grep -Fc -- "$pattern" "$file" || true)"
  [ "$actual" -eq "$expected" ] || fail "expected $expected occurrence(s) of '$pattern', got $actual"
}

assert_present() {
  grep -Fq -- "$1" "${2:-$WORKFLOW}" || fail "missing workflow invariant: $1"
}

assert_absent() {
  ! grep -Fq -- "$1" "${2:-$WORKFLOW}" || fail "forbidden workflow pattern remains: $1"
}

top_level_block() {
  local heading="$1"
  awk -v heading="$heading" '
    $0 == heading ":" { inside = 1 }
    inside && seen && /^[^[:space:]#][^:]*:/ { exit }
    inside { print; seen = 1 }
  ' "$WORKFLOW"
}

job_block() {
  local job="$1"
  awk -v heading="  ${job}:" '
    $0 == heading { inside = 1 }
    inside && seen && /^  [[:alnum:]_-]+:/ { exit }
    inside { print; seen = 1 }
  ' "$WORKFLOW"
}

step_block() {
  local job="$1" step="$2" block
  block="$(job_block "$job")"
  awk -v target="$step" '
    $0 == "      - name: " target { inside = 1 }
    inside && seen && /^      - name:/ { exit }
    inside { print; seen = 1 }
  ' <<< "$block"
}

assert_block_present() {
  local block="$1" pattern="$2" owner="$3"
  grep -Fq -- "$pattern" <<< "$block" || fail "$owner is missing: $pattern"
}

assert_block_count() {
  local expected="$1" block="$2" pattern="$3" owner="$4" actual
  actual="$(grep -Fc -- "$pattern" <<< "$block" || true)"
  [ "$actual" -eq "$expected" ] || \
    fail "$owner expected $expected occurrence(s) of '$pattern', got $actual"
}

assert_step_contract() {
  local job="$1" step="$2" expected_url="$3" forbidden_url="$4" block pattern actual
  block="$(step_block "$job" "$step")"
  [ -n "$block" ] || fail "missing workflow step '$step' in job '$job'"

  for pattern in \
    'APP_VARIANT: development' \
    'BACKEND_ENVIRONMENT_CAPABILITY: development' \
    "EXPO_PUBLIC_API_URL: $expected_url"; do
    actual="$(grep -Fc -- "$pattern" <<< "$block" || true)"
    [ "$actual" -eq 1 ] || fail "expected exactly one '$pattern' in step '$step', got $actual"
  done

  ! grep -Fq -- "EXPO_PUBLIC_API_URL: $forbidden_url" <<< "$block" || \
    fail "step '$step' contains the opposite platform URL: $forbidden_url"
}

trigger_block="$(top_level_block on)"
permissions_block="$(top_level_block permissions)"
concurrency_block="$(top_level_block concurrency)"
prepare_block="$(job_block prepare)"
select_step_block="$(step_block prepare 'Select execution decision')"
build_server_block="$(job_block build-server)"
android_block="$(job_block e2e-mobile-android)"
ios_block="$(job_block e2e-mobile-ios)"

[ -n "$trigger_block" ] || fail 'missing on trigger block'
assert_count 1 '  schedule:'
assert_count 1 '    - cron: "17 3 * * *"'
assert_count 1 '  workflow_dispatch:'
assert_block_present "$trigger_block" '      ref:' 'workflow_dispatch'
assert_block_present "$trigger_block" '        required: true' 'workflow_dispatch ref input'
assert_block_present "$trigger_block" '        type: string' 'workflow_dispatch ref input'
for retired in '  push:' '  pull_request:' 'production' 'run-e2e' 'github.event.pull_request' 'labeled'; do
  ! grep -Fq -- "$retired" <<< "$trigger_block" || fail "retired trigger remains: $retired"
done

assert_count 1 '  contents: read'
assert_count 1 '  actions: read'
for forbidden_permission in 'contents: write' 'actions: write' 'packages: write' 'deployments: write'; do
  ! grep -Fq -- "$forbidden_permission" <<< "$permissions_block" || fail "write permission introduced: $forbidden_permission"
done
assert_block_present "$concurrency_block" '  group: ci-mobile-e2e' 'workflow concurrency'
assert_block_present "$concurrency_block" '  cancel-in-progress: false' 'workflow concurrency'

[ -n "$prepare_block" ] || fail 'missing prepare job'
for output in should_run target_sha comparison_base reason; do
  assert_block_present "$prepare_block" "      $output: \${{ steps.select.outputs.$output }}" 'prepare outputs'
done
assert_block_present "$prepare_block" '          fetch-depth: 0' 'prepare checkout'
assert_block_present "$prepare_block" "          ref: \${{ github.event_name == 'workflow_dispatch' && inputs.ref || 'main' }}" 'prepare checkout'
assert_block_present "$prepare_block" 'github.rest.actions.listWorkflowRuns' 'scheduled-run lookup'
assert_block_present "$prepare_block" "                event: 'schedule'" 'scheduled-run lookup'
assert_block_present "$prepare_block" "                branch: 'main'" 'scheduled-run lookup'
assert_block_present "$prepare_block" '.filter((run) => run.run_number < currentRunNumber)' 'preceding-run selection'
assert_block_present "$prepare_block" 'previous?.head_sha' 'preceding-run boundary'
assert_block_present "$prepare_block" "          MANUAL_REF: \${{ inputs.ref }}" 'manual ref environment'
assert_block_present "$prepare_block" 'target_sha="$(git rev-parse HEAD^{commit})"' 'immutable target resolution'
assert_block_present "$prepare_block" 'Manual dispatch requires a non-empty ref input' 'manual validation'
manual_branch="$(awk '
  /if \[ "\$EVENT_NAME" = '\''workflow_dispatch'\'' \]; then/ { inside = 1 }
  inside { print }
  inside && /^[[:space:]]*fi$/ { exit }
' <<< "$select_step_block")"
[ -n "$manual_branch" ] || fail 'missing manual dispatch decision branch'
assert_block_count 1 "$manual_branch" "echo 'should_run=true' >> \"\$GITHUB_OUTPUT\"" 'manual dispatch decision'
assert_block_present "$prepare_block" 'No preceding scheduled attempt; both platforms selected' 'first-run diagnostic'
assert_block_present "$prepare_block" 'git cat-file -e "$PREVIOUS_SHA^{commit}"' 'comparison validation'
assert_block_present "$prepare_block" 'git diff --name-only "$PREVIOUS_SHA" "$target_sha"' 'scheduled comparison'
assert_block_present "$prepare_block" 'No relevant changes; native allocation skipped' 'skip diagnostic'
assert_absent 'conclusion:'
assert_absent '24 hour'
assert_absent '24-hour'
assert_absent 'success()'

for relevant_path in 'mobile/*' 'openapi/*' 'server/*' 'ci/e2e-server.sh' \
  'ci/generate-dummy-firebase-key.sh' '.nvmrc' '.github/workflows/ci-mobile-e2e.yml'; do
  assert_block_present "$prepare_block" "$relevant_path" 'relevant path set'
done

assert_downstream_contract() {
  local job="$1" block="$2" expected_needs="$3"
  [ -n "$block" ] || fail "missing downstream job: $job"
  assert_block_present "$block" "$expected_needs" "$job dependency"
  assert_block_present "$block" "    if: needs.prepare.outputs.should_run == 'true'" "$job condition"
  assert_block_present "$block" '          ref: ${{ needs.prepare.outputs.target_sha }}' "$job checkout"
}

assert_downstream_contract build-server "$build_server_block" '    needs: prepare'
assert_downstream_contract e2e-mobile-android "$android_block" '    needs: [prepare, build-server]'
assert_downstream_contract e2e-mobile-ios "$ios_block" '    needs: prepare'
assert_block_present "$ios_block" '    timeout-minutes: 120' 'e2e-mobile-ios execution budget'
assert_absent '${{ github.sha }}'
assert_count 3 '          ref: ${{ needs.prepare.outputs.target_sha }}'
assert_count 3 "    if: needs.prepare.outputs.should_run == 'true'"
assert_block_count 3 "$build_server_block" '${{ needs.prepare.outputs.target_sha }}' build-server
assert_block_count 2 "$android_block" '${{ needs.prepare.outputs.target_sha }}' e2e-mobile-android
assert_block_count 1 "$ios_block" '${{ needs.prepare.outputs.target_sha }}' e2e-mobile-ios

assert_step_contract e2e-mobile-android 'Prebuild Android (dev variant)' 'http://10.0.2.2:3005' 'http://localhost:3005'
assert_step_contract e2e-mobile-android 'Build release APK' 'http://10.0.2.2:3005' 'http://localhost:3005'
assert_step_contract e2e-mobile-ios 'Prebuild iOS (dev variant)' 'http://localhost:3005' 'http://10.0.2.2:3005'
assert_step_contract e2e-mobile-ios 'Build Release simulator app' 'http://localhost:3005' 'http://10.0.2.2:3005'

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

assert_failure_artifact() {
  local job="$1" step="$2" name="$3" block
  block="$(step_block "$job" "$step")"
  [ -n "$block" ] || fail "missing failure artifact step '$step' in '$job'"
  assert_block_present "$block" '        if: failure()' "$step"
  assert_block_present "$block" "          name: $name" "$step"
}

assert_failure_artifact e2e-mobile-android 'Upload Maestro debug output' maestro-debug-android
assert_failure_artifact e2e-mobile-android 'Upload server logs artifact' e2e-server-logs-android
assert_failure_artifact e2e-mobile-ios 'Upload Maestro debug output' maestro-debug-ios
assert_failure_artifact e2e-mobile-ios 'Upload server logs artifact' e2e-server-logs-ios

assert_baseline() {
  grep -Fq -- "$1" "$BASELINE_WORKFLOW" || fail "ci-mobile.yml is missing the E2E-contract invariant: $1"
}

assert_baseline '- ".github/workflows/ci-mobile-e2e.yml"'
assert_baseline './mobile/e2e/test_run_e2e.sh'
assert_baseline './mobile/e2e/test_ci_mobile_e2e.sh'

expect_mutation_failure() {
  local label="$1" expression="$2" mutant
  mutant="$mutation_dir/${label}.yml"
  cp "$WORKFLOW" "$mutant"
  perl -0pi -e "$expression" "$mutant"
  ! cmp -s "$WORKFLOW" "$mutant" || fail "mutation '$label' did not change the workflow"
  if RUN_MUTATIONS=0 WORKFLOW="$mutant" "$BASH_SOURCE" > "$mutation_dir/${label}.log" 2>&1; then
    fail "mutation '$label' escaped the workflow proof"
  fi
}

if [ "$RUN_MUTATIONS" = 1 ]; then
  mutation_dir="$(mktemp -d)"
  trap 'rm -rf "$mutation_dir"' EXIT
  expect_mutation_failure trigger 's/  schedule:/  schedule_removed:/'
  expect_mutation_failure manual-should-run 's/(if \[ "\$EVENT_NAME" = '\''workflow_dispatch'\'' \]; then.*?)echo '\''should_run=true'\'' >> "\$GITHUB_OUTPUT"/${1}echo '\''should_run=false'\'' >> "\$GITHUB_OUTPUT"/s'
  expect_mutation_failure previous-boundary 's/previous\?\.head_sha/previous?.updated_at/'
  expect_mutation_failure first-run 's/No preceding scheduled attempt; both platforms selected/No boundary available/'
  expect_mutation_failure android-platform 's/  e2e-mobile-android:/  e2e-mobile-android-removed:/'
  expect_mutation_failure ios-platform 's/  e2e-mobile-ios:/  e2e-mobile-ios-removed:/'
  expect_mutation_failure ios-timeout 's/    timeout-minutes: 120/    timeout-minutes: 75/'
  expect_mutation_failure preparation-dependency 's/    needs: \[prepare, build-server\]/    needs: build-server/'
  expect_mutation_failure failure-artifact 's/(name: Upload Maestro debug output\n        )if: failure\(\)/${1}if: always()/'
fi

echo '[test_ci_mobile_e2e] PASS'
