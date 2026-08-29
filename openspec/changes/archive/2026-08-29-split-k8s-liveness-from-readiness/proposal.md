## Why

The server Deployment currently sends both Kubernetes probes to the database-backed
`/health` route, so four transient Postgres timeouts can make kubelet restart an otherwise
healthy Node process. The prerequisite rollout is complete: production runs image
`main-45744433011131f0c8ab99ff32b412f11509b7b3`, and `/health/live` plus `/health` have
both been proven healthy on all three pods.

## What Changes

- Point the server container's liveness probe at the dependency-free `/health/live`
  endpoint while retaining `/health` as the database-aware readiness endpoint.
- Extend the existing focused Helm render test to assert the intentional liveness and
  readiness path split and protect it in the existing `Test Helm chart` CI job.
- Keep probe timings, server code, image configuration, environment values, and all
  other chart behavior unchanged.

## Capabilities

### New Capabilities

- `timecalendar-chart-probes`: Defines the server Deployment's distinct process-liveness
  and dependency-readiness probe routes and their render-level regression proof.

### Modified Capabilities

None.

## Impact

- Affected implementation files: `k8s/timecalendar/templates/server-deployment.yaml`
  and `ci/test-timecalendar-chart.sh` only.
- `k8s/` is a sensitive deployment surface. Both preproduction and production ArgoCD
  Applications track this chart on `main` with automated sync/self-heal, so merging the
  implementation changes the production pod template and rolls all three replicas.
- The production apply is already authorized on [TIM-360](/TIM/issues/TIM-360), after
  the compatible image and both routes were verified live. No additional merge or deploy
  approval is required.
- No server code, OpenAPI/generated client, database schema, chart values, probe timing,
  Terraform, workflow, mobile/native/store configuration, or legacy Flutter change is
  included.
