# OTA control-plane live bootstrap record

**Status:** complete · **Owner:** Founding Engineer
**Source:** TIM-181 (Phase 10, step 5 OTA)

## Result

- `https://ota.timecalendar.app/hc` returns HTTP 200.
- `https://ota.timecalendar.app/dashboard` returns the expected HTTP 301 to `/dashboard/`,
  which returns HTTP 200.
- The xprem app is named `TimeCalendar` and has public app UUID
  `e89170b9-5b32-44f0-8f78-33eadb60ec28`.
- The app uses xprem `v3.1.2` database-managed signing keys.
- Its public certificate is committed at `mobile/codesigning/certs/certificate.pem`.
- Certificate SHA-256 fingerprint:
  `D9:24:B6:3E:67:2D:0F:D3:3D:28:F9:C9:24:C5:33:89:62:8E:83:3B:92:94:08:50:01:66:1B:E8:6F:4D:64:4A`.
- Certificate subject and issuer are `CN=TimeCalendar`; validity is
  `2026-08-26T16:42:41Z` through `2036-08-26T16:42:41Z`.

The pinned server generated and encrypted the per-app private key. The separate
`npx expo-updates codesigning:generate` flow was deliberately not run, because that would create
a second unrelated trust root. No local private signing-key file exists or needs collection;
the private key remains inside xprem's encrypted database-key store. The off-repo dashboard
password handoff remains unrelated signing material and is not recorded here.

The mobile wiring issue should use the UUID and certificate path above for `npx eoas init` and
Expo Updates verification. No app config, OTA publish, channel mutation, API token, rollback,
store build, submission, or production update was performed here.

## Completed production prerequisite

The production operator ran the already-reviewed apply for `lyrolab/platform` at `main` and
prepared the existing xprem dashboard password in the off-repo handoff file. No password,
Secret, kubeconfig, or environment output was copied into GitHub, Paperclip, or this repository.

The Kubernetes bootstrap already applied successfully in GitHub Actions run
`32886281589`. The Terraform edge change merged as `70616a5b23880756f59225b0d486dbd773248e7c`
after an exact-head plan of `2 to add, 0 to change, 0 to destroy`, but its apply workflow is
manual by design.

The completed **Terraform Apply (infra)** run is
[`32987456261`](https://github.com/lyrolab/platform/actions/runs/32987456261). The follow-up xprem
credential-policy correction merged in
[`lyrolab/platform#75`](https://github.com/lyrolab/platform/pull/75) and reconciled through Argo CD
without manual Kubernetes mutation.

The credential was prepared on the production-access machine with this no-stdout procedure:

```bash
doctl kubernetes cluster kubeconfig save cluster01 --expiry-seconds 600

install -d -m 700 -o dev -g dev /home/dev/.config/timecalendar-ota
umask 077
kubectl get secret -n timecalendar-ota timecalendar-ota-env-secret \
  -o jsonpath='{.data.ADMIN_PASSWORD}' \
  | base64 -d > /home/dev/.config/timecalendar-ota/admin-password
chown dev:dev /home/dev/.config/timecalendar-ota/admin-password
chmod 600 /home/dev/.config/timecalendar-ota/admin-password
```

The file is a local credential handoff to the assigned agent. Do not print it. The agent will
use it only to authenticate to the deployed xprem dashboard/API and will never place its value
in git or Paperclip.

## Why this flow was selected

- Before the Terraform edge apply and Argo reconciliation, `ota.timecalendar.app` and
  `ota-assets.timecalendar.app` had no DNS answers.
- In that same pre-apply state, directing `ota.timecalendar.app` to ingress `67.207.79.128`
  reached nginx but returned `503`; public TLS was not yet available without the Cloudflare edge.
- This agent's `do-fra1-cluster01-paperclip` service account cannot read the namespace, pods, or
  Secret. The full production kubeconfig and Terraform credentials are deliberately unavailable.
- xprem `v3.1.2` uses database-key mode for dashboard-created apps: it generates and encrypts the
  per-app signing key and exposes a downloadable public certificate. Do not run the separate Expo
  key-pair generator; that would create an unrelated trust root.

## Verification commands

These commands succeeded without `--resolve` or `--insecure`:

```bash
getent ahostsv4 ota.timecalendar.app
getent ahostsv4 ota-assets.timecalendar.app
curl --fail --show-error --silent https://ota.timecalendar.app/hc
curl --fail --show-error --silent --output /dev/null https://ota.timecalendar.app/dashboard
```

If a later check fails, inspect live reconciliation without changing resources:

```bash
kubectl get application -n argocd timecalendar-ota \
  -o jsonpath='{.status.sync.status}{" "}{.status.health.status}{"\n"}'
kubectl get deployment,pod,service,ingress -n timecalendar-ota -o wide
kubectl describe deployment -n timecalendar-ota \
  -l app.kubernetes.io/instance=timecalendar-ota
```

Only the apply run URL, endpoint status, public app UUID, certificate path/fingerprint, and
selected signing flow are safe to report. Do not report credential contents.

## Downstream handoff

This record unblocks TIM-182's client endpoint, app-id, channel, and certificate wiring.
Independent publishing and store work remains outside this handoff.

Merge: autonomous — granted by the board in TIM-181: "`Merge: autonomous` for this ticket and the OTA chain it feeds ([TIM-179](/TIM/issues/TIM-179), [TIM-180](/TIM/issues/TIM-180), [TIM-182](/TIM/issues/TIM-182)): merge the certificate commit and its docs yourself on green CI, no board approval, no hand-back to me."

This grant does not authorize the Terraform apply itself; the apply is the human-owned deploy act
described above.
