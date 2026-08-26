# (HUMAN: Apply the OTA edge and expose the dashboard credential)

**Status:** blocking the live bootstrap only · **Owner:** TimeCalendar production operator
**Source:** TIM-181 (Phase 10, step 5 OTA)

## What I need

Run the already-reviewed production apply for `lyrolab/platform` at `main`, then leave the
existing xprem dashboard password in the off-repo handoff file shown below. Do not paste the
password, Secret, kubeconfig, or any environment output into GitHub or Paperclip.

The Kubernetes bootstrap already applied successfully in GitHub Actions run
`32886281589`. The Terraform edge change merged as `70616a5b23880756f59225b0d486dbd773248e7c`
after an exact-head plan of `2 to add, 0 to change, 0 to destroy`, but its apply workflow is
manual by design.

```bash
gh workflow run terraform-apply-infra.yml \
  --repo lyrolab/platform \
  --ref main
```

Open the newly dispatched **Terraform Apply (infra)** run and require a green result. Then, on
the production-access machine:

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

## Why

- `ota.timecalendar.app` and `ota-assets.timecalendar.app` currently have no DNS answers.
- Directing `ota.timecalendar.app` to ingress `67.207.79.128` currently reaches nginx but returns
  `503`; public TLS is not available without the Cloudflare edge.
- This agent's `do-fra1-cluster01-paperclip` service account cannot read the namespace, pods, or
  Secret. The full production kubeconfig and Terraform credentials are deliberately unavailable.
- xprem `v3.1.2` uses database-key mode for dashboard-created apps: it generates and encrypts the
  per-app signing key and exposes a downloadable public certificate. Do not run the separate Expo
  key-pair generator; that would create an unrelated trust root.

## How to verify

After the apply is green, these commands must succeed without `--resolve` or `--insecure`:

```bash
getent ahostsv4 ota.timecalendar.app
getent ahostsv4 ota-assets.timecalendar.app
curl --fail --show-error --silent https://ota.timecalendar.app/hc
curl --fail --show-error --silent --output /dev/null https://ota.timecalendar.app/dashboard
```

If either HTTP check still fails, inspect the live reconciliation without changing resources:

```bash
kubectl get application -n argocd timecalendar-ota \
  -o jsonpath='{.status.sync.status}{" "}{.status.health.status}{"\n"}'
kubectl get deployment,pod,service,ingress -n timecalendar-ota -o wide
kubectl describe deployment -n timecalendar-ota \
  -l app.kubernetes.io/instance=timecalendar-ota
```

Report only the apply run URL, the endpoint status, and that
`/home/dev/.config/timecalendar-ota/admin-password` is ready. Do not report the file contents.

## Blocks

The live portion of TIM-181: creating or confirming the TimeCalendar app, recording its public
UUID, and downloading the server-generated public certificate. Independent source work remains
outside this handoff.

Merge: autonomous — granted by the board in TIM-181: "`Merge: autonomous` for this ticket and the OTA chain it feeds ([TIM-179](/TIM/issues/TIM-179), [TIM-180](/TIM/issues/TIM-180), [TIM-182](/TIM/issues/TIM-182)): merge the certificate commit and its docs yourself on green CI, no board approval, no hand-back to me."

This grant does not authorize the Terraform apply itself; the apply is the human-owned deploy act
described above.
