## Context

`server/src/config/constants.ts` computes the default worker concurrency as
`+(env.QUEUE_CONCURRENCY ?? 100)`. The chart does not currently render that variable,
while the live ConfigMaps retain an out-of-band value of `"10"`. Because that key is
absent from Helm's desired manifest, ArgoCD's three-way merge has left it unmanaged.

The prerequisite platform change is merged: both production and preproduction values
now set `timecalendar.queueConcurrency: 10`. This chart change must land before the
separate orphan-key cleanup so ArgoCD takes ownership without replacing the live value
with the server default.

This touches `k8s/`, a sensitive surface rendered into both namespaces with ArgoCD
`prune` and `selfHeal` enabled. The proof must therefore inspect rendered manifests, not
only the template source.

## Goals / Non-Goals

**Goals:**

- Make `QUEUE_CONCURRENCY` an explicit, chart-owned ConfigMap entry.
- Preserve the platform override of `10` in both environments.
- Keep the chart safe when rendered without overrides or with an explicitly empty value.
- Prove the ConfigMap render changes by exactly one key.

**Non-Goals:**

- Changing server queue behavior or its runtime default.
- Adding a `checksum/config` pod annotation.
- Editing the platform repository, live ConfigMaps, secrets, or ArgoCD applications.
- Removing orphaned credentials/configuration or rotating credentials.
- Changing any other ConfigMap entry.

## Decisions

## Decision 1 — Default at both the values and template boundaries

Add `timecalendar.queueConcurrency: 100` to the chart defaults and render the ConfigMap
entry as:

```yaml
QUEUE_CONCURRENCY: {{ .Values.timecalendar.queueConcurrency | default 100 | quote }}
```

The values default makes the chart's public configuration legible. The template-level
`default 100` is the safety guard: Helm treats `""` as empty, so an accidental empty
override falls back to `100`. Without that guard, Kubernetes would deliver `""` and the
server's numeric coercion would produce `0`, silently stalling the default queue.

Alternative: rely only on `values.yaml`. Rejected because an explicit empty override
wins over that file and reaches the server as zero.

Alternative: reject empty input with schema validation. Rejected for this narrow change
because the chart has no `values.schema.json`; the in-template fallback is local,
backward-compatible, and directly covers the failure mode.

## Decision 2 — Platform values remain the environment authority

The chart default stays aligned with the server default (`100`), while environment
values select the operational value (`10`). No environment-specific value is copied
into this repository.

Alternative: default the chart to `10`. Rejected because it would diverge from
`server/src/config/constants.ts` and turn a temporary operational override into an
implicit application default.

## Decision 3 — Render-level tests are the proof boundary

Add a small committed chart-render test that runs Helm and asserts:

- an override of `10` renders exactly one `QUEUE_CONCURRENCY: "10"` entry;
- no override renders exactly one `QUEUE_CONCURRENCY: "100"` entry;
- an empty override also renders `"100"`, never `""`; and
- the rendered ConfigMap contains no unexpected duplicate queue-concurrency key.

Wire that test into the existing build/test workflow so the footgun cannot regress.
Reviewer verification additionally renders against the exact production and
preproduction values from the sibling platform repository and diffs the ConfigMap
against `main` to prove the only manifest delta is the new entry.

Alternative: source inspection or `helm lint` alone. Rejected because neither evaluates
Helm's empty-value semantics nor proves the quoted output consumed by Kubernetes.

## Risks / Trade-offs

- **[Chart lands before environment overrides]** → The prerequisite platform PR is
  already merged at commit `fecc211106388d50b85dcdd631832b55104e634e`; re-render both
  environment files immediately before handoff and review.
- **[Empty value becomes numeric zero]** → Keep `default 100` in the template and cover
  an explicit empty override in the committed render test.
- **[Unrelated ConfigMap drift is hidden in a broad render]** → Extract and diff the
  ConfigMap rendered from `main` and the implementation branch; accept only the single
  `QUEUE_CONCURRENCY` line.
- **[CI workflow expansion affects unrelated jobs]** → Add only a bounded Helm setup and
  chart-test step; do not change build, deploy, branch, or image behavior.
- **[ConfigMap update does not restart existing pods]** → Accepted and out of scope; the
  independent checksum-annotation ticket owns rollout-on-config-change behavior.

## Migration Plan

1. Land the already-merged platform values (`10`) first — complete.
2. Add the chart value, ConfigMap render, and render-level CI proof in this repository.
3. Verify production and preproduction render `"10"`, the bare chart and empty override
   render `"100"`, and the ConfigMap delta from `main` contains only the new key.
4. Merge the chart change; ArgoCD then owns `QUEUE_CONCURRENCY` while preserving `10`.
5. The separate orphan-key cleanup may run only after this chart ownership is live.

Rollback is a revert of this chart change. That removes the desired key from new chart
renders but does not itself perform the separate live-key cleanup; coordinate any
rollback with that rollout ticket if it has already run.

## Open Questions

None. The platform value, server default, sequencing, and merge policy are all resolved.
