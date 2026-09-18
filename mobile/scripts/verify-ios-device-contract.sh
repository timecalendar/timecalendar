#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work_root="$(mktemp -d "${TMPDIR:-/tmp}/timecalendar-ios-contract.XXXXXX")"

cleanup() {
  rm -rf -- "$work_root"
}
trap cleanup EXIT HUP INT TERM

node "$project_root/scripts/assert-ios-device-contract.mjs" --self-test
node "$project_root/scripts/assert-android-device-contract.mjs" --self-test

mkdir -p "$work_root/mobile"
rsync -a \
  --exclude '/node_modules' \
  --exclude '/ios' \
  --exclude '/android' \
  --exclude '/.expo' \
  "$project_root/" "$work_root/mobile/"
ln -s "$project_root/node_modules" "$work_root/mobile/node_modules"

cd "$work_root/mobile"
OTA_CHANNEL=preview BACKEND_ENVIRONMENT_CAPABILITY=preview npx expo prebuild --platform all --clean --no-install
node "$project_root/scripts/assert-ios-device-contract.mjs" "$work_root/mobile/ios"
node "$project_root/scripts/assert-android-device-contract.mjs" "$work_root/mobile/android"
