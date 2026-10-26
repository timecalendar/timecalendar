#!/usr/bin/env bash
# Runs the unit suite once per zone of the CI time-zone matrix
# (testing.md → Time zones). Extra arguments go to Jest.
set -euo pipefail

for zone in Pacific/Kiritimati Pacific/Pago_Pago America/St_Johns; do
  echo "== TZ=$zone"
  TZ="$zone" npx jest --ci "$@"
done
