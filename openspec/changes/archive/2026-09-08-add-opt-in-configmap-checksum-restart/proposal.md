## Why

The server imports its runtime environment from a chart-rendered ConfigMap, but changing that ConfigMap does not mutate the pod template or restart the running pods. This allowed corrected configuration to sync while existing pods continued serving stale values, so the chart needs an explicitly activated restart mechanism that remains inert when this implementation merges.

## What Changes

- Add a clearly named, default-disabled server chart boolean that opts the server pod template into a checksum of the rendered `server-configmap.yaml`.
- When enabled, render `checksum/config` on `spec.template.metadata.annotations` using Helm's `$.Template.BasePath` include form so a ConfigMap content change rolls server pods.
- Compose the checksum with the existing `server.podAnnotations` map while preserving its behavior and the byte-identical default render.
- Add focused chart-render regression coverage for the disabled default, enabled placement and scope, checksum sensitivity to ConfigMap values, and checksum insensitivity to image-tag changes.
- Document immediately above `envFrom` that the ConfigMap-before-Secret ordering is deliberate and that the Secret remains authoritative for duplicate keys.
- Keep activation out of this change. Current production and preproduction values remain disabled/unset; activation and its resulting restart belong to [TIM-314](/TIM/issues/TIM-314).

Explicitly out of scope:

- Checksumming or otherwise changing `timecalendar-env-secret`, which is supplied by a separate platform source and is not rendered by this chart.
- Editing platform values, restarting workloads, changing ArgoCD state, or performing any deployment or production action.
- Changing the web Deployment, ConfigMap data, images, replicas, probes, resources, application code, API contracts, database schema, Terraform, workflows, or legacy Flutter code.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `timecalendar-chart-runtime-config`: add a default-inert, opt-in ConfigMap checksum contract for the server pod template and preserve the load-bearing `envFrom` precedence contract in chart documentation.

## Impact

- Chart implementation: `k8s/timecalendar/values.yaml` and `k8s/timecalendar/templates/server-deployment.yaml`.
- Automated proof: `ci/test-timecalendar-chart.sh`, already run by the existing chart CI job; no workflow edit is expected.
- Specification: `openspec/specs/timecalendar-chart-runtime-config/spec.md` through this change's delta.
- Sensitive surface: `k8s/`. The implementation PR is safe to merge only while the new gate remains false or unset in live values; that state must render no checksum annotation and no server pod-template delta other than the requested explanatory YAML comment.
- API contract, generated clients, database migrations, native/store configuration, Terraform, workflows, and legacy Flutter: no changes.
- Architecture Book and ADR: N/A. This is a leaf server-chart behavior with no mobile architecture rule or costly-to-reverse mobile decision.
