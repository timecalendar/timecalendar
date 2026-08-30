## Context

`k8s/timecalendar/templates/server-deployment.yaml` currently renders `/health` for both
the liveness and readiness probes. That route performs a one-second Postgres ping. Four
consecutive failures therefore tell kubelet that the process is dead even when Node is
healthy, causing an avoidable restart instead of merely removing the pod from Service
endpoints.

The server lifecycle change has already delivered the intended split: `/health/live` is
unauthenticated and dependency-free, while `/health` retains its database-backed behavior.
The ordering prerequisite is complete on [TIM-360](/TIM/issues/TIM-360): production runs
exact image `main-45744433011131f0c8ab99ff32b412f11509b7b3`, both routes returned 200 on
all three pods, Node is PID 1, readiness is green, and restart counts are zero. The same
ticket records board authorization for the ArgoCD apply triggered when this change merges.

The chart already has a focused render seam in `ci/test-timecalendar-chart.sh`, executed by
the `Test Helm chart` CI job. The implementation can protect the probe contract without a
new workflow, test framework, chart value, or dependency.

## Goals / Non-Goals

**Goals:**

- Make Kubernetes liveness represent process health only.
- Preserve database-aware readiness so an unavailable database removes a pod from Service
  endpoints without causing a process restart.
- Protect the exact split in a deterministic Helm render test already exercised by CI.
- Keep the chart-only implementation and production rollout auditable.

**Non-Goals:**

- Changing server code, `server/Dockerfile`, either health endpoint, or the image tag.
- Changing probe thresholds, periods, timeouts, ports, or initial delays.
- Diagnosing Postgres latency, changing resource limits, or rightsizing the workload.
- Editing ArgoCD Applications, Terraform, workflow definitions, or environment values.
- Performing a manual rollout or any live `kubectl` write.

## Decision 1 — Split probe responsibility by endpoint

Change only `livenessProbe.httpGet.path` to `/health/live`; retain
`readinessProbe.httpGet.path: /health` and every other probe field byte-for-byte. This
maps kubelet's two decisions to their intended semantics: a healthy Node process remains
alive during database latency, while a pod that cannot reach Postgres stops receiving
traffic.

Alternative: point both probes at `/health/live`. Rejected because readiness would stop
protecting callers from pods whose required database dependency is unavailable.

Alternative: retain `/health` and increase liveness tolerances. Rejected because it still
classifies dependency failure as process death and merely delays the erroneous restart.

## Decision 2 — Extend the existing render proof at the probe boundary

Extend `ci/test-timecalendar-chart.sh` to render only
`templates/server-deployment.yaml` and assert that the liveness probe contains exactly
`path: /health/live` while the readiness probe contains exactly `path: /health`. The
assertion must associate each path with its named probe block rather than merely count both
strings somewhere in the manifest, so swapping or duplicating the paths fails the test.

Keep the existing queue-concurrency assertions intact. The existing `Test Helm chart` job
already installs pinned Helm and invokes this script, so no `.github/workflows/` edit is
needed.

Alternative: inspect the source template with grep. Rejected because source inspection
does not prove the Kubernetes manifest rendered by Helm.

Alternative: add a general YAML test framework. Rejected because the chart has a bounded
Bash/Helm seam, and a new dependency would exceed this two-path contract.

## Decision 3 — Let the authorized merge drive the rollout

The implementation follows the normal autonomous review/merge path. No agent performs a
manual `kubectl` apply, rollout restart, or ArgoCD sync. Once the Reviewer merges the PR,
the existing automated ArgoCD sync changes the server pod-template hash and rolls the three
replicas. Post-merge verification is read-only: confirm the synced Deployment renders the
split paths, all three new pods are Ready, `/health/live` and `/health` return 200, Node
remains PID 1, and restart counts remain zero.

Rollback is a revert of the chart commit, which restores `/health` as the liveness path and
causes the same automated rollout. A manual rollback is outside this ticket and would need
its own deploy-act ownership and authorization.

Alternative: require another approval immediately before merge. Rejected because the board
authorization on [TIM-360](/TIM/issues/TIM-360) explicitly covers this chart apply after the
compatible image was proven live.

## Risks / Trade-offs

- **[The chart lands against an incompatible image]** → The prerequisite production image
  and both routes were proven on [TIM-360](/TIM/issues/TIM-360); Reviewer must re-confirm
  that evidence before merge.
- **[Readiness accidentally loses database awareness]** → Leave its path and timing fields
  unchanged, and make the render proof associate `/health` with `readinessProbe`.
- **[A weak test passes when paths are swapped or duplicated]** → Scope assertions to each
  named probe block and require exactly one expected path in each block.
- **[Merge rolls all production replicas]** → Flag `k8s/` in the PR and every handoff, rely
  on normal Deployment readiness gating, and record read-only rollout health after ArgoCD
  sync.
- **[Liveness no longer detects database failure]** → Intentional: database availability is
  a readiness concern; liveness continues detecting failure of the process-local endpoint.

## Migration Plan

1. Confirm the [TIM-360](/TIM/issues/TIM-360) image/route evidence and deploy
   authorization remain the latest prerequisite state.
2. Change only the liveness path and extend the existing focused chart-render assertion.
3. Run Helm lint, the committed chart proof, OpenSpec validation, and a final diff audit.
4. Complete autonomous review and merge; allow existing ArgoCD automation to sync `main`.
5. Collect read-only production rollout evidence for the three replacement pods and both
   routes, then close the issue.

## Open Questions

None. Endpoint semantics, image compatibility, deploy authorization, scope, and rollout
mechanism are resolved.
