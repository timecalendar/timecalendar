## Why

The live TimeCalendar ConfigMaps carry `QUEUE_CONCURRENCY: "10"` outside the Helm
release, so ArgoCD cannot manage or safely prune that setting. The platform production
and preproduction values now both declare `timecalendar.queueConcurrency: 10`; the
application chart must render that value before the orphan-key cleanup proceeds.

## What Changes

- Add a chart-level `timecalendar.queueConcurrency` value whose safe standalone default
  is `100`, matching the server runtime default.
- Render `QUEUE_CONCURRENCY` into the server ConfigMap, preserving platform overrides and
  treating an empty Helm value as `100` rather than emitting an empty string that the
  server would coerce to zero.
- Add deterministic chart-render verification for the production override,
  preproduction override, bare-chart fallback, and one-key-only ConfigMap delta.
- Keep the checksum annotation, platform values, orphan-key deletion, credential
  rotation, and all other ConfigMap entries out of scope.

## Capabilities

### New Capabilities

- `timecalendar-chart-runtime-config`: Defines how the TimeCalendar Helm chart owns and
  safely renders server queue-concurrency configuration.

### Modified Capabilities

None.

## Impact

- Affected chart files: `k8s/timecalendar/values.yaml` and
  `k8s/timecalendar/templates/server-configmap.yaml`.
- Verification may add a chart-render test under `ci/` and wire it into
  `.github/workflows/ci-build-deploy.yml`; that workflow is a sensitive surface and must
  remain limited to proving this chart contract.
- Runtime effect after ArgoCD sync: both platform environments render the already-merged
  override `QUEUE_CONCURRENCY: "10"`; a bare chart renders `"100"`.
- No server code, API/OpenAPI contract, database schema, secrets, mobile/native config,
  Terraform, or legacy Flutter behavior changes.
