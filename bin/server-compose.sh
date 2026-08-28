#!/usr/bin/env bash

set -euo pipefail

fail() {
  printf 'server-compose: %s\n' "$*" >&2
  exit 1
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" ||
  fail "run this command from a TimeCalendar git checkout"
repo_root="$(cd "$repo_root" && pwd -P)"

if [ ! -f "$repo_root/server/docker-compose.yml" ]; then
  fail "server/docker-compose.yml was not found under $repo_root"
fi

common_dir="$(git -C "$repo_root" rev-parse --git-common-dir)"
if [[ "$common_dir" != /* ]]; then
  common_dir="$repo_root/$common_dir"
fi
common_dir="$(cd "$common_dir" && pwd -P)"
main_root="$(cd "$common_dir/.." && pwd -P)"

if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then
  project_name="$COMPOSE_PROJECT_NAME"
elif [ "$repo_root" = "$main_root" ]; then
  project_name="server"
else
  worktree_slug="$(basename "$repo_root" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9_-]+/-/g; s/^[-_]+//; s/[-_]+$//')"
  worktree_slug="${worktree_slug:-worktree}"
  worktree_slug="${worktree_slug:0:32}"
  worktree_slug="$(printf '%s' "$worktree_slug" | sed -E 's/[-_]+$//')"
  path_hash="$(printf '%s' "$repo_root" | git hash-object --stdin | cut -c1-8)"
  project_name="server-${worktree_slug}-${path_hash}"
fi

if [ "${1:-}" = "project-name" ]; then
  if [ "$#" -ne 1 ]; then
    fail "project-name does not accept additional arguments"
  fi
  printf '%s\n' "$project_name"
  exit 0
fi

exec docker compose \
  --project-name "$project_name" \
  --file "$repo_root/server/docker-compose.yml" \
  "$@"
