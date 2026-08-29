## 1. Reconfirm the authorized prerequisite

- [x] 1.1 Re-read the latest [TIM-360](/TIM/issues/TIM-360) evidence before editing and
  record that production still runs exact image
  `main-45744433011131f0c8ab99ff32b412f11509b7b3`, all three pods proved
  `/health/live` and `/health` with HTTP 200, readiness was green, Node was PID 1,
  restart counts were zero, and the board authorization explicitly covers this ArgoCD
  chart apply.

## 2. Split the rendered probe routes

- [x] 2.1 In `k8s/timecalendar/templates/server-deployment.yaml`, change only
  `livenessProbe.httpGet.path` from `/health` to `/health/live`; keep
  `readinessProbe.httpGet.path` on `/health` and leave all ports, thresholds, periods,
  timeouts, resources, image fields, and other Deployment content unchanged.
- [x] 2.2 Render `templates/server-deployment.yaml` with Helm and manually inspect the
  server container block to confirm liveness is `/health/live`, readiness is `/health`,
  and each probe contains exactly one HTTP path.

## 3. Extend the focused Helm proof

- [x] 3.1 Extend `ci/test-timecalendar-chart.sh` with a bounded assertion that renders
  only the server Deployment and associates exactly one `/health/live` path with
  `livenessProbe` and exactly one `/health` path with `readinessProbe`; ensure swapped,
  duplicated, or missing paths fail while preserving every existing queue-concurrency
  assertion.
- [x] 3.2 Keep `.github/workflows/ci-build-deploy.yml` unchanged because its existing
  pinned-Helm `Test Helm chart` job already invokes `./ci/test-timecalendar-chart.sh`;
  if implementation discovers that a workflow edit is necessary, stop and flag the
  sensitive-surface scope expansion before making it.

## 4. Architecture and operator documentation

- [x] 4.1 Evaluate the mobile Architecture Book and decision log against the final
  implementation. Record the update as N/A in the PR/handoff because this Kubernetes
  leaf change adds no mobile rule and makes no costly-to-reverse architecture decision;
  do not add unrelated mobile documentation or an ADR.
- [x] 4.2 Compare `docs/agent-dev-environment.md` health-route and chart-CI guidance with
  the final implementation. Update it only if the current operational contract becomes
  inaccurate; otherwise record that the existing `/health/live` liveness and `/health`
  readiness descriptions plus chart-test command remain current.

## 5. Local green and CI proof

- [x] 5.1 Run `helm lint k8s/timecalendar` and record the successful result.
- [x] 5.2 Run `./ci/test-timecalendar-chart.sh` and record the successful probe-split
  and existing queue-concurrency assertions; this is the exact focused proof exercised by
  the existing `Test Helm chart` CI job.
- [x] 5.3 Run `openspec validate split-k8s-liveness-from-readiness` and record the
  successful result.
- [x] 5.4 After pushing, confirm the PR-head `Test Helm chart` check passes. Human/device
  QA is N/A because this change is backend/infrastructure-only and has a deterministic
  rendered-manifest proof.

## 6. Scope audit

- [x] 6.1 Inspect the implementation diff and confirm it changes only
  `k8s/timecalendar/templates/server-deployment.yaml` and
  `ci/test-timecalendar-chart.sh` (plus these OpenSpec artifacts); explicitly flag
  `k8s/` as the deploy-sensitive surface and confirm there are no changes to server code,
  `server/Dockerfile`, OpenAPI/generated clients, migrations, chart values, probe timing,
  Terraform, workflows, mobile native/store config, secrets, or legacy Flutter.

## Reviewer merge and rollout closeout

These are issue-level Reviewer obligations tracked on [TIM-361](/TIM/issues/TIM-361), not
OpenSpec implementation tasks or archive prerequisites:

- Immediately before autonomous merge, re-read the PR state/comments and the
  [TIM-360](/TIM/issues/TIM-360) authorization evidence, then merge without performing a
  manual apply, ArgoCD sync, rollout restart, or other live write.
- After automated ArgoCD sync, collect read-only production evidence that the
  Deployment has liveness `/health/live` and readiness `/health`, all three replacement
  pods are Ready, both routes return HTTP 200, Node remains PID 1, and restart counts are
  zero; record the rollout result on [TIM-361](/TIM/issues/TIM-361) before closing it.
