#!/usr/bin/env bash

set -euo pipefail

readonly CHART_DIR="${1:-k8s/timecalendar}"

assert_queue_concurrency() {
  local expected="$1"
  shift

  local rendered
  rendered="$(helm template timecalendar "$CHART_DIR" "$@")"

  local key_count
  key_count="$(grep -c '^[[:space:]]*QUEUE_CONCURRENCY:' <<<"$rendered" || true)"
  if [[ "$key_count" -ne 1 ]]; then
    echo "Expected exactly one QUEUE_CONCURRENCY entry, found $key_count" >&2
    return 1
  fi

  if ! grep -q "^[[:space:]]*QUEUE_CONCURRENCY: \"${expected}\"$" <<<"$rendered"; then
    echo "Expected QUEUE_CONCURRENCY to render as \"${expected}\"" >&2
    return 1
  fi
}

assert_queue_concurrency 10 --set timecalendar.queueConcurrency=10
assert_queue_concurrency 100
assert_queue_concurrency 100 --set-string timecalendar.queueConcurrency=

echo "TimeCalendar chart queue-concurrency renders passed"
