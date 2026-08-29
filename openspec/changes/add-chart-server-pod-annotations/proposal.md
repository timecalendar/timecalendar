## Why

The TimeCalendar server Deployment consumes its credentials through
`envFrom.secretRef: timecalendar-env-secret`
(`k8s/timecalendar/templates/server-deployment.yaml:48-52`) and carries no annotation that
changes when that Secret changes. When a sealed secret is updated in `lyrolab/platform`,
ArgoCD replaces the Secret object but the Deployment spec stays byte-identical, so no
rollout is triggered and the running pods keep serving the old environment value
indefinitely.

There is no GitOps-side way to force that rollout today. The agent has admin RBAC in
`timecalendar-preprod` and can `kubectl rollout restart` there, but
`timecalendar-production` is read-only plus `pods/exec`
(`kubernetes/clusters/do-fra1-cluster01/05-rbac/timecalendar-production-rbac.yaml` in
`lyrolab/platform`), and widening that RBAC is itself a production deploy act. A
pod-template annotation removes the problem entirely: the rotation commit and the restart
become a single ArgoCD sync.

This is a capability gap, not a rotation-specific hack. It unblocks the production half of
the 2026-10-06 Redis credential rotation ([TIM-307](/TIM/issues/TIM-307), prepared by
[TIM-335](/TIM/issues/TIM-335)), and [TIM-289](/TIM/issues/TIM-289) and
[TIM-313](/TIM/issues/TIM-313) are parked on the same missing mechanism.

## What Changes

- Add an optional `server.podAnnotations` map to the chart, rendered onto
  `spec.template.metadata.annotations` of the **server** Deployment only.
- Declare `server.podAnnotations: {}` in `k8s/timecalendar/values.yaml` with a comment
  stating that setting or changing any key rolls the server pods on the next ArgoCD sync,
  and that this is the supported way to apply an `envFrom` Secret change.
- Keep the default completely inert: with `server.podAnnotations` unset, the rendered
  manifest is byte-identical to the pre-change render for both platform environments.
- Extend the committed chart-render proof (`ci/test-timecalendar-chart.sh`) so the inert
  default, the single-location placement, and the untouched web Deployment cannot regress.

Explicitly not in scope:

- `k8s/timecalendar/templates/web-deployment.yaml` — only the server reads
  `timecalendar-env-secret`.
- A Helm-computed `checksum/secret` annotation. The values live in a SealedSecret in a
  different repository; the chart cannot see the plaintext, and a fabricated checksum is
  worse than an explicit operator-written stamp.
- Setting any actual annotation value. The chart default stays empty; the per-environment
  stamp is written in `lyrolab/platform` when a rotation runs.
- Any `REDIS_URL`, credential, new environment key, live-cluster write, or platform-repo
  edit.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `timecalendar-chart-runtime-config`: gains the pod-annotation rollout mechanism for the
  server Deployment, plus the inert-default guarantee that makes it safe to merge dark.

## Impact

- Affected chart files: `k8s/timecalendar/templates/server-deployment.yaml` and
  `k8s/timecalendar/values.yaml`.
- Affected verification: `ci/test-timecalendar-chart.sh`, already wired into the
  `test-chart` job of `.github/workflows/ci-build-deploy.yml`. No workflow edit is
  expected; if one is needed it stays limited to this chart proof.
- Runtime effect after ArgoCD sync: **none**. Both platform environments render exactly
  what they render today, so nothing rolls on merge.
- No server code, OpenAPI contract, generated client, database migration, secret, mobile
  or native config, Terraform, or legacy Flutter change.

## Sensitive surfaces

`k8s/` is a deploy surface. This chart is what ArgoCD renders for **production**, where the
application is `automated` + `selfHeal`, so a template mistake reaches production on the
next sync. The byte-identical render proof against the real per-environment values is the
gate that makes this safe — treat it as the gate, not a formality.

Merging this is **not** a deploy act: with the default empty, ArgoCD's render is unchanged.
The deploy act is later, when a rotation writes a stamp value in `lyrolab/platform`.
