## Context

`k8s/timecalendar/templates/server-deployment.yaml` renders the server Deployment. Its pod
template currently carries labels and nothing else:

```yaml
  template:
    metadata:
      labels:
        {{- include "timecalendar.selectorLabels" . | nindent 8 }}
```

Environment comes in through `envFrom`: a ConfigMap rendered by this chart, and
`timecalendar-env-secret`, a SealedSecret owned by `lyrolab/platform`. Kubernetes does not
restart pods when an `envFrom` source changes — env vars are injected once at container
start. So a credential rotation lands in the cluster and has no effect until something
mutates the pod template or something restarts the pods.

Neither is available in production today. `timecalendar-production` grants the agent
read-only access plus `pods/exec`; there is no `deployments` write and therefore no
`kubectl rollout restart`. The application is ArgoCD `automated` + `selfHeal`, so the
manifest ArgoCD renders is the only lever, and the chart gives it no field to change.

This change adds that field. It touches `k8s/`, a deploy surface whose render reaches
production on the next sync, so the proof obligation is on the **rendered manifests**, not
on the template source.

## Goals / Non-Goals

**Goals:**

- Give a GitOps commit a supported way to roll the server pods with no `kubectl` write.
- Keep the mechanism generic — a pod annotation, usable by any future rollout need, not a
  rotation-specific field.
- Guarantee that merging the change is inert: unset default renders byte-identically to
  today for both platform environments.
- Confine the annotation to the server pod template — not the Deployment's own metadata,
  not the web Deployment.
- Make all three properties regression-proof in committed CI.

**Non-Goals:**

- Computing a `checksum/secret` or `checksum/config` annotation in the chart.
- Adding pod annotations to the web Deployment.
- Writing any annotation value, in this repository or in `lyrolab/platform`.
- Rotating a credential, touching `REDIS_URL`, or performing any live-cluster act.
- Widening the `timecalendar-production` RBAC.

## Decisions

## Decision 1 — `{{- with }}` guard, not an unconditional `annotations:` block

Render the block as:

```yaml
  template:
    metadata:
      {{- with .Values.server.podAnnotations }}
      annotations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      labels:
        {{- include "timecalendar.selectorLabels" . | nindent 8 }}
```

`with` treats the empty map `{}` as falsy, so the default emits **nothing at all** — no
`annotations:` key, no `annotations: {}`. That is what makes the default byte-identical
rather than merely semantically equivalent, and byte-identity is the property the
acceptance criteria demand and the property a reviewer can actually verify with a digest.

Alternative: `annotations: {{- toYaml .Values.server.podAnnotations | nindent 8 }}`
unconditionally. Rejected — it renders `annotations: {}` in the default case. Kubernetes
would accept it, but the pre/post render digests would differ, destroying the single
strongest safety argument for merging this into a `selfHeal` production application.

Alternative: the one-line form sketched in the ticket
(`{{- with … }}annotations: {{- toYaml . | nindent 8 }}{{- end }}`). Equivalent output;
the multi-line form is used because it is the `helm create` scaffold shape, is what a
reviewer reads fastest, and keeps the `nindent 8` visually anchored to its `annotations:`
key at indent 6.

The block goes **above** `labels:` so that an empty map leaves the surrounding lines
untouched; `{{-` chomping means the guard lines themselves contribute no blank lines.

## Decision 2 — The value is `server.podAnnotations`, nested under `server`

The chart's per-component values already live under `server.*` and `web.*`
(`replicaCount`, `tag`). Nesting the new key there is consistent, and it makes the scope
boundary structural: a `server.podAnnotations` value cannot leak into the web Deployment,
so "web is untouched" is true by construction rather than by discipline.

Alternative: a top-level `podAnnotations` shared by both Deployments. Rejected — it would
roll the web pods on every server credential rotation for no reason, and it is explicitly
out of scope.

## Decision 3 — No Helm-computed checksum

The chart cannot compute a checksum of `timecalendar-env-secret`: the plaintext lives in a
SealedSecret in `lyrolab/platform` and is never visible to `helm template`. A
`checksum/config`-style annotation over chart-rendered content would hash *the chart's own
rendered output*, so it would fire on chart edits and stay silent on exactly the event this
change exists to catch — a sealed-secret rotation. That is worse than nothing: it looks
like an automatic rollout guarantee while providing none.

An explicit operator-written stamp is honest. The commit that rotates the sealed secret in
`lyrolab/platform` also writes the stamp key in the same environment values file, so the
rotation and the rollout are one reviewable diff and one ArgoCD sync.

Alternative: an ArgoCD `Application`-level sync hook or a restart job. Rejected — it needs
cluster write permissions this repository does not own, and it moves the mechanism out of
the chart that the reviewer can prove.

## Decision 4 — Byte-identical render digests are the acceptance gate

Verification renders the chart against the exact per-environment values from
`lyrolab/platform` `origin/main`
(`kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-{preprod,production}/values.yaml`)
at `origin/main` of this repository and at the implementation, and compares SHA-256 digests
of the full rendered output. Equal digests are the claim; a reviewer re-runs the commands
and compares, rather than accepting an assertion.

A Proposer-side feasibility probe against platform `origin/main` at `3a635c6` already
confirmed the shape works: both environments produced identical digests before and after
the prototype edit (preprod `30eaa507…`, production `8c22f547…`), and a rendered stamp
value appeared once, on the server pod template at line `spec.template.metadata.annotations`,
with the web Deployment's pod template unchanged. These digests are pinned to that platform
commit and to this chart's current content — the Applier must re-derive them, not quote
them.

Alternative: `helm lint` plus reading the template. Rejected — neither evaluates Helm's
falsy-empty-map semantics nor produces a comparable artifact, and this surface is
production with `selfHeal`.

## Decision 5 — The committed CI proof asserts placement, not just presence

Extend `ci/test-timecalendar-chart.sh` (already run by the `test-chart` job in
`.github/workflows/ci-build-deploy.yml`) with three assertions, each using
`helm template --show-only` so the two Deployments are isolated deterministically:

1. **Inert default** — `--show-only templates/server-deployment.yaml` with no override
   contains no `annotations:` line anywhere.
2. **Placement** — with one annotation set, the same render differs from the default render
   by exactly the two added lines (`annotations:` and the key), and the added
   `annotations:` line sits at pod-template indentation, not at the Deployment's own
   `metadata`.
3. **Web isolation** — `--show-only templates/web-deployment.yaml` renders identically with
   and without `server.podAnnotations` set.

Assertion 2 is what a naive presence-grep would miss: an annotation block accidentally
placed under the Deployment's `metadata:` would still make `grep annotations` succeed while
never rolling a single pod.

## Risks / Trade-offs

- **[Annotation lands on the wrong `metadata:`]** → It would be silently useless: ArgoCD
  updates the Deployment object, pods never restart, and the next rotation appears to
  succeed while serving stale credentials. Covered by CI assertion 2 and by a reviewer
  reading the rendered pod template, not the template source.
- **[The default is not truly inert]** → The whole safety argument for merging into a
  `selfHeal` production app collapses. Covered by Decision 1's `with` guard and the
  per-environment digest comparison in tasks 4.1–4.2.
- **[A future editor makes the block unconditional]** → CI assertion 1 fails on the bare
  render.
- **[Setting a stamp rolls production pods]** → That is the intended effect, and it is a
  deploy act performed in `lyrolab/platform`, not here. The server Deployment has
  `replicaCount: 3` in production, no explicit strategy (so default RollingUpdate) and a
  readiness probe, so the roll is gradual rather than an outage. Worth stating in the
  values comment so the operator knows what a one-character edit does.
- **[Annotation keys contain dots]** → `--set server.podAnnotations.timecalendar\.app/x=…`
  needs escaping; a values file does not. Prefer a values file in `lyrolab/platform` and
  use `--set-string` only in tests.
- **[Chart is also installable standalone]** → Default `{}` keeps a bare
  `helm template k8s/timecalendar` unchanged, which the existing CI script already renders.

## Migration Plan

1. Land this chart change. ArgoCD's render is unchanged for both environments, so nothing
   syncs, nothing rolls, no deploy act occurs.
2. When a rotation runs (e.g. [TIM-307](/TIM/issues/TIM-307)), the `lyrolab/platform` commit
   that updates `env-sealed-secret.yaml` also adds a stamp under
   `server.podAnnotations` in the same environment values file — one diff, one sync, pods
   roll with the new credential.
3. The stamp key persists between rotations; only its value changes. Removing it would also
   change the pod template and therefore also roll the pods.

Rollback is a plain revert of this change. It is safe at any time **unless** an environment
values file already sets `server.podAnnotations`, in which case reverting silently drops
that annotation from the render and rolls the server pods once. Check the platform values
before reverting.

## Open Questions

None. Placement, scope boundary, default, and the merge policy are all settled by the
ticket; the acceptance gate is a mechanical digest comparison.
