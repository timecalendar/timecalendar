## Context

`k8s/timecalendar/templates/server-deployment.yaml` imports the complete server environment from the chart-rendered `timecalendar-configmap` followed by the separately supplied `timecalendar-env-secret`. Kubernetes captures those values when a container starts; changing the ConfigMap alone does not mutate `spec.template` and therefore does not start a rollout.

The server pod template already supports an optional `server.podAnnotations` map. Its empty default is guarded so no `annotations:` key is rendered. The checksum capability must compose with that existing map, preserve its behavior, and remain disabled in the current production and preproduction platform values. The chart is rendered by ArgoCD as a multi-source Helm application, so the checksum source must be the rendered chart template reached through `$.Template.BasePath`, not `.Files` and not the external Secret.

This change touches `k8s/`, a sensitive deployment surface. ArgoCD auto-sync makes rendered-output proof the safety boundary: merging the implementation must not alter the Kubernetes server pod template or restart either environment. A later values change under [TIM-314](/TIM/issues/TIM-314) is the separately authorized activation and rollout act.

The order of the two `envFrom` entries is also load-bearing. Kubernetes resolves duplicate keys from the later source, so `secretRef` must remain after `configMapRef`. Swapping them, or removing a duplicated key from the Secret, would silently expose the stale ConfigMap value.

## Goals / Non-Goals

**Goals:**

- Provide a clear boolean that opts the server Deployment into an automatic checksum of the rendered server ConfigMap.
- Preserve an inert false/unset default for bare, production, and preproduction renders.
- Place the checksum only on `spec.template.metadata.annotations` of the server Deployment.
- Preserve arbitrary `server.podAnnotations` and define deterministic behavior if that map already contains `checksum/config`.
- Prove the checksum changes for ConfigMap content changes and stays stable for non-ConfigMap values such as `server.tag`.
- Document and preserve the ConfigMap-before-Secret `envFrom` ordering.

**Non-Goals:**

- Enabling the gate in platform values or causing a server restart.
- Checksumming, moving, changing, or otherwise managing `timecalendar-env-secret`.
- Adding a restart mechanism to the web Deployment.
- Changing any ConfigMap key, server image, replica count, probe, resource, API contract, schema, workflow, Terraform, mobile/native configuration, or legacy Flutter surface.

## Decisions

## Decision 1 — Use the direct boolean `server.configMapChecksumEnabled`, default `false`

Declare `server.configMapChecksumEnabled: false` beside the existing server chart values. A direct boolean makes the operational effect visible at the call site and avoids implying there are additional checksum modes or settings.

The template treats false and an omitted value identically. Neither state contributes an annotation, so both current platform values files remain inert without needing an explicit live-values edit.

Alternative: make checksum behavior the default. Rejected because merging would mutate both live pod templates and trigger an ArgoCD-driven restart, collapsing implementation and rollout authorization into one act.

Alternative: use a nested `server.configMapChecksum.enabled` object. Rejected because there is only one setting and the extra namespace suggests unsupported configuration surface.

## Decision 2 — Build one effective server annotation map and reserve `checksum/config` when enabled

Start from a deep copy of `server.podAnnotations`. When the checksum gate is true, set `checksum/config` on that copy to:

```gotemplate
{{ include (print $.Template.BasePath "/server-configmap.yaml") . | sha256sum }}
```

Render the resulting map through the existing guarded `annotations:` block. This has three properties:

1. an empty map plus a false gate still emits no `annotations:` key;
2. existing custom server pod annotations continue to render alongside the checksum;
3. if a custom map already provides `checksum/config`, the enabled chart-computed checksum replaces it rather than emitting duplicate YAML keys.

The deep copy avoids mutating `.Values.server.podAnnotations` as a side effect of Helm's `set` function. The checksum key is chart-owned only while the gate is enabled; with the gate disabled, the existing generic annotation mechanism retains its current behavior.

Alternative: render a second `annotations:` block for the checksum. Rejected because enabling both mechanisms would produce duplicate mapping keys.

Alternative: emit the checksum entry before or after `toYaml .Values.server.podAnnotations`. Rejected because a caller-provided `checksum/config` would still create a duplicate key with parser-dependent results.

## Decision 3 — Hash the rendered ConfigMap through `$.Template.BasePath`

Hash the output of the existing `server-configmap.yaml` template, using the include expression required above. This captures every rendered ConfigMap value, including `timecalendar.crisp.websiteId`, and excludes values used only by the Deployment, including `server.tag`.

Alternative: use `.Files.Get`. Rejected because Helm `.Files` cannot read chart templates, and the ArgoCD multi-source layout supplies external values rather than packaging the platform repository into the chart.

Alternative: checksum `timecalendar-env-secret`. Rejected because that Secret comes from the platform repository's kustomize source and is not rendered or readable by this Helm chart. Secret-only rotations remain a separate mechanism decision.

## Decision 4 — Use a Helm template comment for the `envFrom` precedence warning

Place a `{{- /* … */}}` template comment immediately above `envFrom:`. It will state that later sources win duplicate keys, `secretRef` must remain after `configMapRef`, the Secret is authoritative for duplicated keys, and removing a key from the Secret falls back to the unmaintained ConfigMap value.

This choice keeps the operational warning next to the ordering it protects while keeping the rendered manifest byte-stable when the checksum gate is disabled. A YAML `#` comment would also be semantically inert, but it would appear in raw `helm template` output and weaken the simplest before/after comparison.

Alternative: document the rule only in prose elsewhere. Rejected because the risk is created by locally reordering this exact list, and the warning should meet the editor at that location.

## Decision 5 — Make the committed render test the regression boundary

Extend `ci/test-timecalendar-chart.sh`, which the existing chart CI job already runs, with assertions that:

- false and omitted gate values render no `checksum/config` and preserve the current empty-annotation behavior;
- enabling the gate yields exactly one `checksum/config` entry under the server pod template, never Deployment metadata or the web Deployment;
- an existing arbitrary pod annotation survives alongside the checksum;
- changing `timecalendar.crisp.websiteId` changes the extracted checksum;
- changing `server.tag` leaves the extracted checksum unchanged;
- the server `envFrom` list retains `configMapRef` before `secretRef`; and
- `web-deployment.yaml` remains untouched and its render is unaffected.

The implementation also renders `origin/main` and the branch against the current production and preproduction platform values. With the gate false/unset, raw output must be byte-identical because Decision 4 uses a template comment. With the gate explicitly enabled, the only Kubernetes object delta attributable to the gate is the server pod-template annotation; the source-only ordering comment does not render.

Alternative: rely on `helm lint` and source review. Rejected because neither proves conditional whitespace behavior, annotation placement, checksum sensitivity, nor isolation from the web Deployment.

## Risks / Trade-offs

- **[The checksum lands on Deployment metadata]** → Assert the parsed/rendered path and exact indentation under `spec.template.metadata`; a top-level annotation would not roll pods.
- **[The enabled checksum collides with a custom annotation]** → Build one effective map and let the computed value own `checksum/config` while enabled.
- **[The false default changes rendered whitespace]** → Use whitespace-chomped local-variable declarations and a Helm template comment, then require byte-identical environment renders against `origin/main`.
- **[A value outside the ConfigMap changes the checksum]** → Compare extracted checksums before and after a `server.tag` override.
- **[A ConfigMap field is accidentally excluded]** → Hash the complete rendered `server-configmap.yaml` output and prove a representative nested value changes the digest.
- **[Operators assume Secret changes are covered]** → State explicitly in values documentation, proposal, PR body, and handoff that the external Secret remains outside the checksum mechanism.
- **[Activation is merged with implementation]** → Keep the chart default false, leave both platform values untouched, and isolate activation to [TIM-314](/TIM/issues/TIM-314).

## Migration Plan

1. Merge this implementation with `server.configMapChecksumEnabled` false by default and absent from both live platform values. ArgoCD renders the same Kubernetes objects, so no pod restart occurs.
2. Under [TIM-314](/TIM/issues/TIM-314), derive the environment-specific values diff, expected pod/environment delta, health checks, abort boundary, and rollback, then obtain the required rollout authorization before enabling the gate.
3. Once enabled for an environment, subsequent rendered ConfigMap changes mutate `checksum/config` and trigger the Deployment's normal rolling update.

Rollback of this implementation is a repository revert while the gate remains disabled. If an environment has since enabled the gate, disabling or removing the annotation also mutates the pod template and can itself roll pods, so rollback belongs to the authorized rollout plan rather than an ad hoc repository revert.

## Open Questions

None. The gate, checksum source, placement, inert merge requirement, activation boundary, and Secret limitation are fixed by the issue brief.
