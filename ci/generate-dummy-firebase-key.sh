#!/usr/bin/env bash
# Generates a dummy Firebase service-account key at $1.
#
# server/src/config/firebase.ts does readFileSync(serviceAccountKey.json) at
# import time and FirebaseModule is in AppModule, so the Nest app cannot boot
# without this file. firebase-admin's cert() only checks the JSON *shape* —
# project_id, client_email and a parseable PEM private_key — and makes no
# network call.
#
# The key is *generated*, never committed: GitHub Push Protection rejects any
# service-account-shaped JSON (even a dummy) in any pushed file, so we mint a
# fresh throwaway RSA private key on every run and assemble the dummy JSON
# around it. Same approach as app/integration_test/run_e2e.sh.
set -euo pipefail

OUTPUT_PATH="${1:?usage: generate-dummy-firebase-key.sh <output-path>}"

mkdir -p "$(dirname "$OUTPUT_PATH")"

# PKCS#8 PEM ('BEGIN PRIVATE KEY') — the same format real service-account
# keys use, so firebase-admin's cert() accepts it.
DUMMY_PRIVATE_KEY="$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null)" \
  python3 - "$OUTPUT_PATH" <<'PY'
import json, os, sys

project = "timecalendar-ci-dummy"
email = f"ci-dummy@{project}.iam.gserviceaccount.com"
key = {
    "type": "service_account",
    "project_id": project,
    "private_key_id": "0" * 40,
    "private_key": os.environ["DUMMY_PRIVATE_KEY"].strip() + "\n",
    "client_email": email,
    "client_id": "0" * 21,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url":
        "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url":
        "https://www.googleapis.com/robot/v1/metadata/x509/"
        + email.replace("@", "%40"),
}
with open(sys.argv[1], "w") as f:
    json.dump(key, f, indent=2)
    f.write("\n")
PY

echo "dummy Firebase service-account key written to $OUTPUT_PATH"
