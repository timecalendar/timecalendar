#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELPER="$SCRIPT_DIR/install_ios_pods.sh"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/timecalendar-pod-install-test.XXXXXX")"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

fail() {
  echo "[test_install_ios_pods] FAIL: $*" >&2
  exit 1
}

assert_count() {
  local expected="$1" pattern="$2" file="$3" actual
  actual="$(grep -Ec -- "$pattern" "$file" 2>/dev/null || true)"
  [ "$actual" -eq "$expected" ] || fail "expected $expected match(es) for '$pattern' in $file, got $actual"
}

make_fixture() {
  local name="$1" fixture
  fixture="$TEST_ROOT/$name"
  mkdir -p "$fixture/bin" "$fixture/home" "$fixture/tmp" "$fixture/cache"

  cp "$TEST_ROOT/fake-pod" "$fixture/bin/pod"
  cp "$TEST_ROOT/fake-curl" "$fixture/bin/curl"
  chmod +x "$fixture/bin/pod" "$fixture/bin/curl"
  printf '%s\n' "$fixture"
}

run_case() {
  local scenario="$1" expected_status="$2" fixture status
  fixture="$(make_fixture "$scenario")"
  set +e
  HOME="$fixture/home" \
    TMPDIR="$fixture/tmp" \
    PATH="$fixture/bin:$PATH" \
    POD_TEST_SCENARIO="$scenario" \
    POD_TEST_CALLS="$fixture/pod-calls" \
    CURL_TEST_CALLS="$fixture/curl-calls" \
    COCOAPODS_TRUNK_SPECS_ROOT="$fixture/cache/Specs" \
    "$HELPER" > "$fixture/output" 2>&1
  status=$?
  set -e
  [ "$status" -eq "$expected_status" ] || fail "$scenario returned $status, expected $expected_status"
  printf '%s\n' "$fixture"
}

# These fakes are copied into a fresh PATH, HOME, TMPDIR, and trunk cache for
# every case. Nothing can succeed because of the host CocoaPods installation or
# a previously restored ~/.cocoapods directory.
cat > "$TEST_ROOT/fake-pod" <<'FAKE_POD'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >> "$POD_TEST_CALLS"
if [[ " $* " != *' --repo-update '* ]]; then
  if [ "$POD_TEST_SCENARIO" = 'retry_failure' ]; then
    echo '[!] Retry resolver failure' >&2
    exit 37
  fi
  echo 'Pod installation complete!'
  exit 0
fi

eligible='[!] CDN: trunk URL couldn'"'"'t be downloaded: https://cdn.jsdelivr.net/cocoa/Specs/e/3/b/GoogleAppMeasurement/12.9.0/GoogleAppMeasurement.podspec.json Response: 400 400: Bad Request'
second='[!] CDN: trunk URL couldn'"'"'t be downloaded: https://cdn.jsdelivr.net/cocoa/Specs/0/3/5/FirebaseCore/12.9.0/FirebaseCore.podspec.json Response: 400 400: Bad Request'

case "$POD_TEST_SCENARIO" in
  normal_success)
    echo 'Pod installation complete!'
    exit 0
    ;;
  eligible_one | invalid_json | identity_mismatch | fallback_fetch_failure | retry_failure)
    echo "$eligible" >&2
    ;;
  eligible_multiple)
    printf '%s\n%s\n%s\n' "$eligible" "$second" "$eligible" >&2
    ;;
  non_400)
    echo "${eligible/Response: 400 400: Bad Request/Response: 503 Service Unavailable}" >&2
    ;;
  resolver)
    echo '[!] CocoaPods could not find compatible versions for pod "Example"' >&2
    ;;
  malformed)
    echo '[!] CDN: trunk URL could not be downloaded cleanly' >&2
    ;;
  mixed)
    printf '%s\n%s\n' "$eligible" '[!] CocoaPods could not find compatible versions for pod "Example"' >&2
    ;;
  wrong_host)
    echo "${eligible/cdn.jsdelivr.net/evil.example}" >&2
    ;;
  wrong_prefix)
    echo "${eligible/cocoa\/Specs/cocoa\/Other}" >&2
    ;;
  wrong_suffix)
    echo "${eligible/.podspec.json/.txt}" >&2
    ;;
  traversal)
    echo "${eligible/Specs\/e\/3\/b/Specs\/e\/3\/b\/..}" >&2
    ;;
  query)
    echo "${eligible/.podspec.json/.podspec.json?download=1}" >&2
    ;;
  fragment)
    echo "${eligible/.podspec.json/.podspec.json#payload}" >&2
    ;;
  unclassified)
    echo 'ERROR: Ruby transport stopped unexpectedly' >&2
    ;;
  *)
    echo "unknown scenario: $POD_TEST_SCENARIO" >&2
    exit 99
    ;;
esac
exit 23
FAKE_POD

cat > "$TEST_ROOT/fake-curl" <<'FAKE_CURL'
#!/usr/bin/env bash
set -euo pipefail

output=''
url=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --output)
      output="$2"
      shift 2
      ;;
    --retry | --retry-delay)
      shift 2
      ;;
    --*)
      shift
      ;;
    *)
      url="$1"
      shift
      ;;
  esac
done

printf '%s\n' "$url" >> "$CURL_TEST_CALLS"
[ "$POD_TEST_SCENARIO" != 'fallback_fetch_failure' ] || exit 22

case "$POD_TEST_SCENARIO" in
  invalid_json)
    printf '%s\n' '{not-json' > "$output"
    ;;
  identity_mismatch)
    printf '%s\n' '{"name":"WrongPod","version":"0.0.0"}' > "$output"
    ;;
  *)
    case "$url" in
      */GoogleAppMeasurement/12.9.0/GoogleAppMeasurement.podspec.json)
        printf '%s\n' '{"name":"GoogleAppMeasurement","version":"12.9.0"}' > "$output"
        ;;
      */FirebaseCore/12.9.0/FirebaseCore.podspec.json)
        printf '%s\n' '{"name":"FirebaseCore","version":"12.9.0"}' > "$output"
        ;;
      *)
        exit 22
        ;;
    esac
    ;;
esac
FAKE_CURL

fixture="$(run_case normal_success 0)"
assert_count 1 '^install --repo-update --ansi$' "$fixture/pod-calls"
[ ! -e "$fixture/curl-calls" ] || fail 'normal success invoked fallback curl'
grep -Fq 'no fallback needed' "$fixture/output" || fail 'normal-success diagnostic missing'

fixture="$(run_case eligible_one 0)"
assert_count 2 '^install' "$fixture/pod-calls"
assert_count 1 '^install --ansi$' "$fixture/pod-calls"
assert_count 1 'GoogleAppMeasurement' "$fixture/curl-calls"
test -f "$fixture/cache/Specs/e/3/b/GoogleAppMeasurement/12.9.0/GoogleAppMeasurement.podspec.json" || \
  fail 'eligible spec was not seeded at its exact cache path'
grep -Fq 'Response: 400 400: Bad Request' "$fixture/output" || fail 'complete first-attempt output was not preserved'

fixture="$(run_case eligible_multiple 0)"
assert_count 2 '^install' "$fixture/pod-calls"
assert_count 1 'GoogleAppMeasurement' "$fixture/curl-calls"
assert_count 1 'FirebaseCore' "$fixture/curl-calls"
test -f "$fixture/cache/Specs/0/3/5/FirebaseCore/12.9.0/FirebaseCore.podspec.json" || \
  fail 'second distinct eligible spec was not seeded'

for scenario in non_400 resolver malformed mixed wrong_host wrong_prefix wrong_suffix traversal query fragment unclassified; do
  fixture="$(run_case "$scenario" 23)"
  assert_count 1 '^install --repo-update --ansi$' "$fixture/pod-calls"
  [ ! -e "$fixture/curl-calls" ] || fail "$scenario invoked fallback curl"
  [ -z "$(find "$fixture/cache" -type f -print -quit)" ] || fail "$scenario wrote into the isolated cache"
done

for scenario in invalid_json identity_mismatch fallback_fetch_failure; do
  fixture="$(run_case "$scenario" 23)"
  assert_count 1 '^install --repo-update --ansi$' "$fixture/pod-calls"
  assert_count 1 'GoogleAppMeasurement' "$fixture/curl-calls"
  [ -z "$(find "$fixture/cache" -type f -print -quit)" ] || fail "$scenario seeded an unvalidated spec"
done

fixture="$(run_case retry_failure 37)"
assert_count 2 '^install' "$fixture/pod-calls"
assert_count 1 '^install --ansi$' "$fixture/pod-calls"
grep -Fq 'single CocoaPods retry failed' "$fixture/output" || fail 'retry-failure diagnostic missing'

if find "$TEST_ROOT" -type d -name 'timecalendar-pod-fallback.*' -print -quit | grep -q .; then
  fail 'helper left run-owned temporary files behind'
fi

echo '[test_install_ios_pods] PASS'
