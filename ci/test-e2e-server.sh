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
readonly COMPOSE="compose -f $REPO_ROOT/server/docker-compose.yml -f $REPO_ROOT/server/docker-compose.e2e.yml"

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

# Exact calls also pin that nginx (binds 1443, needs certs) is never started and
# that only the db:init run builds the image.
check_up() {
  local label="$1" image="$2" build_flag="$3"
  local log="$WORK_DIR/$label.log"

  DOCKER_LOG="$log" PATH="$WORK_DIR/bin:$PATH" E2E_SERVER_IMAGE="$image" \
    "$REPO_ROOT/ci/e2e-server.sh" up > /dev/null

  if ! diff -u - "$log" <<EXPECTED >&2; then
$COMPOSE up --wait postgres redis
$COMPOSE run --rm ${build_flag}server npm run db:init
$COMPOSE up --wait server
EXPECTED
    echo "FAIL [$label]: compose-mode up must start postgres/redis, seed, then start the server." >&2
    exit 1
  fi
}

check_up "local-build" "" "--build "
check_up "prebuilt-image" "timecalendar-server:ci" ""

echo "OK: compose-mode up seeds before the server starts."
