#!/usr/bin/env bash
#
# Sets up (and verifies) everything the app needs to talk to the local HTTPS
# dev env at https://api.timecalendar.host:1443. Safe to run repeatedly.
#
# Checks, in order:
#   1. /etc/hosts maps the *.timecalendar.host names to 127.0.0.1
#   2. web/.env.local exists (created from the sample if missing)
#   3. the self-signed dev cert is trusted in the booted iOS Simulator (macOS)
#   4. the API is actually reachable through nginx with a valid cert
#
# Each of these, when missing, surfaces as the SAME opaque "Network Error" in
# the app's import webview. This script tells you exactly which one is broken.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT="$ROOT/ci/certificates/cert.pem"
HOSTS=(timecalendar.host api.timecalendar.host web.timecalendar.host)

green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*"; }
step() { printf '\n\033[1m%s\033[0m\n' "$*"; }

fail=0

# 1. /etc/hosts ---------------------------------------------------------------
step "1/4  /etc/hosts entries"
missing=()
for h in "${HOSTS[@]}"; do
  if ! grep -qE "^[^#]*127\.0\.0\.1[[:space:]].*\b${h//./\\.}\b" /etc/hosts; then
    missing+=("$h")
  fi
done
if [ ${#missing[@]} -eq 0 ]; then
  green "✓ all *.timecalendar.host names map to 127.0.0.1"
else
  yellow "✗ missing host entries: ${missing[*]}"
  line="127.0.0.1 ${HOSTS[*]}"
  echo "  Adding them now (needs sudo):"
  echo "    $line"
  if printf '\n# TimeCalendar local dev\n%s\n' "$line" | sudo tee -a /etc/hosts >/dev/null; then
    green "✓ added to /etc/hosts"
  else
    red "✗ could not write /etc/hosts. Add this line manually:"
    echo "    $line"
    fail=1
  fi
fi

# 2. web/.env.local -----------------------------------------------------------
step "2/4  web/.env.local"
if [ -f "$ROOT/web/.env.local" ]; then
  green "✓ web/.env.local exists"
else
  cp "$ROOT/web/.env.local.sample" "$ROOT/web/.env.local"
  green "✓ created web/.env.local from sample"
  yellow "  → restart the web dev server (npm run dev) so it picks up the vars"
fi

# 3. dev cert in the iOS Simulator (macOS only) -------------------------------
step "3/4  iOS Simulator trusts the dev cert"
if [ "$(uname)" != "Darwin" ]; then
  yellow "– not macOS, skipping (trust $CERT in your OS/browser cert store)"
elif ! command -v xcrun >/dev/null 2>&1; then
  yellow "– Xcode command line tools not found, skipping simulator cert"
elif ! xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
  yellow "✗ no booted simulator. Boot one, then re-run, or:"
  echo "    xcrun simctl keychain booted add-root-cert $CERT"
else
  xcrun simctl keychain booted add-root-cert "$CERT"
  green "✓ dev cert added as trusted root in the booted simulator"
  yellow "  → hot-restart the app so WKWebView re-evaluates trust"
fi

# 4. end-to-end reachability --------------------------------------------------
step "4/4  API reachable through nginx with a valid cert"
code="$(curl -s -o /dev/null -w '%{http_code}' --cacert "$CERT" \
  https://api.timecalendar.host:1443/ 2>/dev/null || echo 000)"
if [ "$code" = "000" ]; then
  red "✗ cannot reach https://api.timecalendar.host:1443 (DNS, nginx, or cert)."
  echo "  Is the Docker stack up?  cd server && docker compose up -d"
  fail=1
else
  green "✓ API responded (HTTP $code) — DNS + nginx + cert all good"
fi
backend="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3005/ 2>/dev/null || echo 000)"
if [ "$backend" = "000" ]; then
  yellow "✗ backend not answering on :3005 — start it:  cd server && npm run dev"
  fail=1
else
  green "✓ backend up on :3005 (HTTP $backend)"
fi

echo
if [ "$fail" -eq 0 ]; then
  green "All set. Run the app with: flutter run"
else
  red "Some checks failed — fix the items above, then re-run: bin/setup-dev.sh"
  exit 1
fi
