## 1. Confirm the deployment prerequisite

- [ ] 1.1 Confirm platform PR `lyrolab/platform#79` is merged and both
  `kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-production/values.yaml`
  and `timecalendar-preprod/values.yaml` at platform `origin/main` contain
  `timecalendar.queueConcurrency: 10`; record the merge commit in the handoff evidence.

## 2. Make queue concurrency chart-owned

- [ ] 2.1 Add `timecalendar.queueConcurrency: 100` to
  `k8s/timecalendar/values.yaml` with a comment tying the default to
  `server/src/config/constants.ts`.
- [ ] 2.2 Add `QUEUE_CONCURRENCY` near the Redis block in
  `k8s/timecalendar/templates/server-configmap.yaml`, rendered with
  `.Values.timecalendar.queueConcurrency | default 100 | quote`; document why an empty
  string would become numeric zero in the server and stall the queue.

## 3. Add the committed CI proof

- [ ] 3.1 Add a focused chart-render test under `ci/` that runs `helm template` and
  asserts an explicit `10` override renders exactly one `QUEUE_CONCURRENCY: "10"`, a
  bare chart renders exactly one `"100"`, and an explicit empty override renders
  `"100"` and never `""`.
- [ ] 3.2 Wire the focused chart-render test into `.github/workflows/ci-build-deploy.yml`
  using a pinned Helm setup step; do not change build, image, deploy, trigger, or branch
  behavior. Treat this workflow edit as a sensitive-surface change in the PR body and
  handoff.

## 4. Architecture and documentation

- [ ] 4.1 Evaluate the mobile Architecture Book and decision log against the final
  implementation. Record the update as N/A in the PR/handoff because this server-chart
  leaf change establishes no mobile rule or costly-to-reverse architecture decision;
  do not add unrelated mobile documentation.
- [ ] 4.2 Update `docs/agent-dev-environment.md` only if the new chart CI command needs
  an operator-facing invocation or changes the documented `ci-build-deploy.yml` gate;
  otherwise record documentation as N/A.

## 5. Local green and acceptance renders

- [ ] 5.1 Run `helm lint k8s/timecalendar` and the committed chart-render CI proof; both
  must pass locally.
- [ ] 5.2 Render the chart against the exact platform production values and the exact
  platform preproduction values at `origin/main`; confirm each server ConfigMap contains
  exactly one `QUEUE_CONCURRENCY: "10"`.
- [ ] 5.3 Run `helm template k8s/timecalendar` with no override and with
  `--set-string timecalendar.queueConcurrency=`; confirm both server ConfigMaps contain
  exactly one `QUEUE_CONCURRENCY: "100"` and never an empty value.
- [ ] 5.4 Render the server ConfigMap from `origin/main` and from the implementation with
  identical values, normalize only irrelevant trailing whitespace, and diff them;
  confirm the sole data delta is the added `QUEUE_CONCURRENCY` line.
- [ ] 5.5 Run `openspec validate render-queue-concurrency-from-chart` and record all exact
  commands/results in the PR and handoff as Reviewer evidence. Human/device QA is N/A.

## 6. Scope and sensitive-surface audit

- [ ] 6.1 Inspect the final diff and confirm no checksum annotation, platform values,
  live resources, secrets, orphan-key cleanup, Terraform, OpenAPI/generated client,
  migration, mobile/native/store config, or legacy Flutter changes were added.
- [ ] 6.2 Confirm `k8s/` and the narrowly scoped CI workflow/test are the only sensitive
  surfaces touched, and explicitly flag both in the PR body and every downstream
  handoff.
