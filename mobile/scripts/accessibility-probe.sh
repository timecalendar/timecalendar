#!/usr/bin/env bash

set -eu

readonly APP_ID="fr.samuelprak.timecalendar.dev"
readonly PROBE_URL="timecalendar-dev://calendar?focusDate=2026-06-15&accessibilityProbe=timed-events"

usage() {
  echo "Usage: $0 <android|ios> <build|launch|logs|reset> <device>"
}

if [ "$#" -ne 3 ]; then
  usage
  exit 2
fi

platform="$1"
action="$2"
device="$3"

case "$platform:$action" in
  android:build)
    npm run android -- --device "$device"
    ;;
  android:launch)
    adb -s "$device" shell am start -W \
      -a android.intent.action.VIEW \
      -d "$PROBE_URL" \
      "$APP_ID"
    ;;
  android:logs)
    adb -s "$device" logcat -v brief ReactNativeJS:I '*:S' |
      sed -n '/calendar-accessibility-probe/p'
    ;;
  android:reset)
    adb -s "$device" shell am force-stop "$APP_ID"
    adb -s "$device" shell pm clear "$APP_ID"
    ;;
  ios:build)
    npm run ios -- --device "$device"
    ;;
  ios:launch)
    echo "Open this URL in Safari on the named device:"
    echo "$PROBE_URL"
    ;;
  ios:logs)
    xcrun devicectl device process launch \
      --device "$device" \
      --terminate-existing \
      --console \
      "$APP_ID" |
      sed -n '/calendar-accessibility-probe/p'
    ;;
  ios:reset)
    xcrun devicectl device uninstall app --device "$device" "$APP_ID"
    ;;
  *)
    usage
    exit 2
    ;;
esac
