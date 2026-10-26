#!/usr/bin/env bash
#
# Proves ci/e2e-server.sh's compose-mode `up` seeds before the server starts.
# The server reads the DB during bootstrap, so an up-then-seed order boots it
# against an empty schema and only the nightly native lane would notice. A fake
# `docker` records every invocation instead of running anything.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly REPO_ROOT
readonly KEY="$REPO_ROOT/server/config/serviceAccountKey.json"

WORK_DIR="$(mktemp -d)"
KEY_PREEXISTED=0
if [[ -e "$KEY" || -L "$KEY" ]]; then
  KEY_PREEXISTED=1
fi

cleanup() {
  rm -rf -- "$WORK_DIR"
  if [[ "$KEY_PREEXISTED" -eq 0 ]]; then
    rm -f -- "$KEY"
  fi
}

trap cleanup EXIT

mkdir -p "$WORK_DIR/bin"
cat > "$WORK_DIR/bin/docker" <<'SH'
#!/usr/bin/env bash
echo "$*" >> "$DOCKER_LOG"
SH
chmod +x "$WORK_DIR/bin/docker"

FAILURES=0

fail() {
  echo "FAIL [$1]: $2" >&2
  FAILURES=$((FAILURES + 1))
}

first_line_matching() {
  { grep -nE -- "$2" "$1" || true; } | head -n1 | cut -d: -f1
}

check_up() {
  local label="$1" image="$2"
  local log="$WORK_DIR/$label.log"
  : > "$log"

  if ! DOCKER_LOG="$log" PATH="$WORK_DIR/bin:$PATH" E2E_SERVER_IMAGE="$image" \
      "$REPO_ROOT/ci/e2e-server.sh" up > "$WORK_DIR/$label.out" 2>&1; then
    cat "$WORK_DIR/$label.out" >&2
    fail "$label" "ci/e2e-server.sh up exited non-zero."
    return
  fi

  local deps seed serve
  deps="$(first_line_matching "$log" ' up --wait( --build)? postgres redis$')"
  seed="$(first_line_matching "$log" ' run --rm( --build)? server npm run db:init$')"
  serve="$(first_line_matching "$log" ' up --wait( --build)? server$')"

  if [[ -z "$deps" || -z "$seed" || -z "$serve" ]]; then
    fail "$label" "expected postgres/redis up, db:init run and server up; recorded:"
    sed 's/^/    /' "$log" >&2
    return
  fi
  ((deps < seed)) || fail "$label" "postgres/redis must be up before the db:init run."
  ((seed < serve)) || fail "$label" "db:init must run before the server is brought up."

  local build_lines
  build_lines="$({ grep -n -- '--build' "$log" || true; } | cut -d: -f1 | tr '\n' ' ')"
  if [[ -z "$image" ]]; then
    [[ "$build_lines" == "$seed " ]] ||
      fail "$label" "--build must appear only on the db:init run (lines: ${build_lines:-none})."
  else
    [[ -z "$build_lines" ]] ||
      fail "$label" "--build must not appear when E2E_SERVER_IMAGE is set (lines: $build_lines)."
  fi

  if grep -q 'nginx' "$log"; then
    fail "$label" "nginx must never be named (it binds 1443 and needs certs)."
  fi
}

check_up "local-build" ""
check_up "prebuilt-image" "timecalendar-server:ci"

if [[ "$FAILURES" -gt 0 ]]; then
  echo "$FAILURES e2e-server lifecycle check(s) failed." >&2
  exit 1
fi
echo "OK: compose-mode up seeds before the server starts."
