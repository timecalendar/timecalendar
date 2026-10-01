#!/usr/bin/env bash
# Builds the profileable perf APK (APP_VARIANT=perf) for a git ref. Run it on the
# Android build host, never on the owner's Mac: Gradle there freezes the machine.
#   perf/build-apk.sh [ref]      default ref: origin/main
# Env: PERF_REPO (clone to build in), PERF_API_URL (baked EXPO_PUBLIC_API_URL),
#      PERF_OUT (APK output directory).
set -euo pipefail

REF=${1:-origin/main}
REPO=${PERF_REPO:-$HOME/Projects/timecalendar-e02}
OUT=${PERF_OUT:-$HOME/perf-apks}
API_URL=${PERF_API_URL:-http://localhost:3005}

export ANDROID_HOME=${ANDROID_HOME:-$HOME/Android/Sdk}
export JAVA_HOME=${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}
export APP_VARIANT=perf BACKEND_ENVIRONMENT_CAPABILITY=development
export EXPO_PUBLIC_API_URL=$API_URL

git -C "$REPO" fetch -q origin
git -C "$REPO" checkout -q --detach "$REF"

export NVM_DIR=${NVM_DIR:-$HOME/.nvm}
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm use "$(cat "$REPO/.nvmrc")" >/dev/null
SHA=$(git -C "$REPO" rev-parse --short HEAD)
echo "BUILDING $SHA $(git -C "$REPO" log -1 --format=%s)"

cd "$REPO/mobile"
npm ci --no-audit --no-fund
if ! grep -q 'APP_VARIANT === "perf"' app.config.ts; then
  echo "$SHA predates the perf variant (app.config.ts has no APP_VARIANT=perf)" >&2
  exit 1
fi
npx expo prebuild --platform android --clean --no-install

cd android
start=$(date +%s)
NODE_ENV=production ./gradlew assembleRelease \
  -PreactNativeArchitectures=arm64-v8a --console=plain
echo "GRADLE_SECONDS=$(($(date +%s) - start))"

mkdir -p "$OUT"
cp app/build/outputs/apk/release/app-release.apk "$OUT/timecalendar-perf-$SHA.apk"
echo "APK=$OUT/timecalendar-perf-$SHA.apk"
