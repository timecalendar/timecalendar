#!/usr/bin/env bash
#
# On GitHub's virtualized macOS runners the simulator's apsd cannot get a device
# certificate, so it reconnects to APNs in a hot loop. The logging that loop produces
# starves the runner until any request or assertion can stall. E2E never uses remote
# push, so the CI simulator runs without the daemon.

set -euo pipefail

readonly SERVICE=user/foreground/com.apple.apsd

if [ -z "${1:-}" ]; then
  echo "usage: $(basename "$0") <simulator-udid>" >&2
  exit 2
fi
readonly UDID="$1"

xcrun simctl bootstatus "$UDID" -b
xcrun simctl spawn "$UDID" launchctl disable "$SERVICE"
xcrun simctl spawn "$UDID" launchctl bootout "$SERVICE" || true

services="$(xcrun simctl spawn "$UDID" launchctl list)"
if awk -F'\t' '$3 == "com.apple.apsd" { found = 1 } END { exit !found }' <<< "$services"; then
  echo "apsd is still loaded in simulator $UDID" >&2
  exit 1
fi
echo "apsd disabled in simulator $UDID"
