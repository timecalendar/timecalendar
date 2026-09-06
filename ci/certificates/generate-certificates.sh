#!/usr/bin/env bash
#
# Regenerates the self-signed TLS pair the local dev nginx serves. Always
# rewrites key.pem and cert.pem, so every existing trust decision (simulator,
# keychain, browser store) has to be redone afterwards. For the safe,
# call-it-every-time path see ensure-certificates.sh.
#
# Lifetime comes from TIMECALENDAR_CERT_DAYS (default 3650).
#
# To add it in MacOS, open Keychain Access > System > add cert.pem here
# security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain cert.pem

set -euo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
days="${TIMECALENDAR_CERT_DAYS:-3650}"

openssl req \
  -x509 \
  -days "$days" \
  -nodes \
  -keyout "$dir/key.pem" \
  -out "$dir/cert.pem" \
  -config "$dir/ssl.cnf"

chmod 600 "$dir/key.pem"
