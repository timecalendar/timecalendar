#!/usr/bin/env bash
#
# Idempotent guard for the local dev TLS pair. Safe to call before every
# Compose command: it regenerates only when key.pem or cert.pem is missing or
# unreadable, or when the certificate expires inside the renewal window
# (TIMECALENDAR_CERT_RENEW_SECONDS, default 30 days). Otherwise it does
# nothing, because rotating the pair invalidates every place a developer has
# trusted it.
#
# Prints exactly `generated` or `unchanged` on stdout; notes go to stderr.

set -euo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
renew_seconds="${TIMECALENDAR_CERT_RENEW_SECONDS:-2592000}"
cert="$dir/cert.pem"
key="$dir/key.pem"

note() { printf 'ensure-certificates: %s\n' "$*" >&2; }

if ! command -v openssl >/dev/null 2>&1; then
  note "openssl was not found on PATH; install it to provision the dev TLS certificate"
  exit 1
fi

if [ ! -r "$cert" ] || [ ! -r "$key" ]; then
  note "no readable certificate pair in $dir, generating one"
elif ! openssl x509 -in "$cert" -noout -checkend "$renew_seconds" >/dev/null 2>&1; then
  note "certificate expires within ${renew_seconds}s, regenerating"
else
  printf 'unchanged\n'
  exit 0
fi

"$dir/generate-certificates.sh" >&2
note "wrote $cert and $key — restart nginx (bin/server-compose.sh restart nginx) and re-trust the certificate"
printf 'generated\n'
