#!/usr/bin/env bash

set -euo pipefail

ALIAS_PREFIX="https://cdn.jsdelivr.net/cocoa/"
OFFICIAL_PREFIX="https://raw.githubusercontent.com/CocoaPods/Specs/master/"
TRUNK_SPECS_ROOT="${COCOAPODS_TRUNK_SPECS_ROOT:-${CP_HOME_DIR:-$HOME/.cocoapods}/repos/trunk/Specs}"
TEMP_ROOT="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/timecalendar-pod-fallback.XXXXXX")"

cleanup() {
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

FIRST_LOG="$TEMP_ROOT/first-install.log"
PLAIN_LOG="$TEMP_ROOT/first-install.plain.log"
ELIGIBLE_LINES="$TEMP_ROOT/eligible-lines.log"
ELIGIBLE_PATHS="$TEMP_ROOT/eligible-paths.log"

echo '[install_ios_pods] Running normal CocoaPods install with repository refresh.'
set +e
pod install --repo-update --ansi 2>&1 | tee "$FIRST_LOG"
first_status=${PIPESTATUS[0]}
set -e

if [ "$first_status" -eq 0 ]; then
  echo '[install_ios_pods] Normal CocoaPods install succeeded; no fallback needed.'
  exit 0
fi

# CocoaPods uses ANSI even when the output is not attached to a terminal. Strip it
# only from the classifier copy; the complete original output remains in the job log.
sed $'s/\033\[[0-9;]*[[:alpha:]]//g' "$FIRST_LOG" > "$PLAIN_LOG"

grep -E "^\[!\] CDN: trunk URL couldn't be downloaded: ${ALIAS_PREFIX}Specs/[^[:space:]]+ Response: 400([[:space:]]|$)" \
  "$PLAIN_LOG" > "$ELIGIBLE_LINES" || true

actionable_count="$(grep -Ec '^\[!\]|(^|[[:space:]])([Ee]rror:|ERROR|[Ff]ailed:|[Ff]ailure:|[Ee]xception)' "$PLAIN_LOG" || true)"
eligible_count="$(wc -l < "$ELIGIBLE_LINES" | tr -d ' ')"

if [ "$eligible_count" -eq 0 ] || [ "$eligible_count" -ne "$actionable_count" ]; then
  echo "[install_ios_pods] CocoaPods failure is not exclusively the eligible Specs alias HTTP-400 form; refusing fallback." >&2
  exit "$first_status"
fi

sed -E "s#^\[!\] CDN: trunk URL couldn't be downloaded: ${ALIAS_PREFIX}([^[:space:]]+) Response: 400.*#\1#" \
  "$ELIGIBLE_LINES" | LC_ALL=C sort -u > "$ELIGIBLE_PATHS"
distinct_count="$(wc -l < "$ELIGIBLE_PATHS" | tr -d ' ')"

while IFS= read -r spec_path; do
  case "$spec_path" in
    *'?'* | *'#'* | *'%'* | *'//'*)
      echo '[install_ios_pods] Eligible-looking URL contains an unsafe path component; refusing fallback.' >&2
      exit "$first_status"
      ;;
  esac

  IFS='/' read -r specs hash1 hash2 hash3 pod_name pod_version filename extra <<EOF
$spec_path
EOF
  if [ "$specs" != 'Specs' ] ||
    ! [[ "$hash1" =~ ^[0-9a-f]$ && "$hash2" =~ ^[0-9a-f]$ && "$hash3" =~ ^[0-9a-f]$ ]] ||
    ! [[ "$pod_name" =~ ^[A-Za-z0-9_.+-]+$ && "$pod_version" =~ ^[A-Za-z0-9_.+-]+$ ]] ||
    [ "$pod_name" = '.' ] || [ "$pod_name" = '..' ] ||
    [ "$pod_version" = '.' ] || [ "$pod_version" = '..' ] ||
    [ "$filename" != "$pod_name.podspec.json" ] || [ -n "${extra:-}" ]; then
    echo '[install_ios_pods] Eligible-looking URL has an invalid CocoaPods Specs path; refusing fallback.' >&2
    exit "$first_status"
  fi

  fallback_file="$TEMP_ROOT/$filename"
  echo "[install_ios_pods] Fetching validated official spec for $pod_name $pod_version."
  if ! curl --fail --location --silent --show-error --retry 2 --retry-delay 1 --retry-connrefused \
    --output "$fallback_file" "${OFFICIAL_PREFIX}${spec_path}"; then
    echo '[install_ios_pods] Official Specs fallback fetch failed.' >&2
    exit "$first_status"
  fi

  if ! node - "$fallback_file" "$pod_name" "$pod_version" <<'NODE'
const fs = require("node:fs");

const [file, expectedName, expectedVersion] = process.argv.slice(2);
let spec;
try {
  spec = JSON.parse(fs.readFileSync(file, "utf8"));
} catch {
  process.exit(1);
}

if (spec.name !== expectedName || spec.version !== expectedVersion) {
  process.exit(1);
}
NODE
  then
    echo '[install_ios_pods] Official Specs fallback JSON identity validation failed.' >&2
    exit "$first_status"
  fi

  cache_path="${spec_path#Specs/}"
  destination="$TRUNK_SPECS_ROOT/$cache_path"
  mkdir -p "${destination%/*}"
  install -m 0644 "$fallback_file" "$destination"
done < "$ELIGIBLE_PATHS"

echo "[install_ios_pods] Seeded $distinct_count distinct eligible alias response(s); retrying once without repository refresh."
set +e
pod install --ansi
retry_status=$?
set -e

if [ "$retry_status" -ne 0 ]; then
  echo '[install_ios_pods] The single CocoaPods retry failed.' >&2
  exit "$retry_status"
fi

echo '[install_ios_pods] CocoaPods install recovered through the official Specs fallback.'
