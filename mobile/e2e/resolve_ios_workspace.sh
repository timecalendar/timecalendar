#!/usr/bin/env bash

set -euo pipefail
shopt -s nullglob

workspace_dir="${1:-.}"
candidates=("$workspace_dir"/*.xcworkspace)
workspaces=()

for candidate in "${candidates[@]}"; do
  [ -d "$candidate" ] && workspaces+=("$candidate")
done

if [ "${#workspaces[@]}" -ne 1 ]; then
  echo "[resolve_ios_workspace] Expected exactly one generated .xcworkspace, found ${#workspaces[@]}." >&2
  exit 1
fi

printf '%s\n' "${workspaces[0]##*/}"
