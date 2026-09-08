## 1. Capture the pre-change render baseline

- [ ] 1.1 Before editing chart implementation files, fetch `origin/main` for this repository and the platform checkout, record both commit ids in the implementation handoff, and confirm the platform production and preproduction values do not set `server.configMapChecksumEnabled`. Do not print or copy secret manifests.
- [ ] 1.2 In `$PAPERCLIP_RUN_SCRATCH_DIR`, materialize `origin/main:k8s/timecalendar` plus the current `timecalendar-preprod/values.yaml` and `timecalendar-production/values.yaml` from platform `origin/main`; render and retain the bare, preproduction, and production baselines with `helm template`, then record their SHA-256 digests before implementation.

## 2. Add the default-inert checksum capability

- [ ] 2.1 Add `server.configMapChecksumEnabled: false` to `k8s/timecalendar/values.yaml` with concise operator guidance that it covers the chart-rendered ConfigMap only, changes the server pod template when enabled, and must remain disabled until the separately authorized [TIM-314](/TIM/issues/TIM-314) activation.
- [ ] 2.2 In `k8s/timecalendar/templates/server-deployment.yaml`, build an effective annotation map from a deep copy of `server.podAnnotations`; when the gate is true, set exactly one `checksum/config` entry using `{{ include (print $.Template.BasePath "/server-configmap.yaml") . | sha256sum }}`, with the computed checksum overriding a colliding custom entry.
- [ ] 2.3 Render the effective annotation map through the existing guarded server `spec.template.metadata.annotations` block so a false or omitted gate plus an empty custom map emits no `annotations:` key, while all non-colliding custom annotations remain unchanged.
- [ ] 2.4 Immediately above `envFrom:`, add a whitespace-neutral `{{- /* … */}}` Helm template comment stating that later sources win duplicate keys, `secretRef` must remain after `configMapRef`, the Secret is authoritative for duplicate keys, and reordering or removing a duplicated Secret key silently falls back to an unmaintained ConfigMap value. Do not reorder or modify either source.
- [ ] 2.5 Leave `k8s/timecalendar/templates/web-deployment.yaml`, `server-configmap.yaml`, images, replicas, probes, resources, platform values, and all unrelated chart behavior untouched; verify with an explicit path-scoped `git diff`.

## 3. Extend the committed CI render proof

- [ ] 3.1 Extend `ci/test-timecalendar-chart.sh` in its existing Bash/Helm style to assert that an omitted or false gate renders no `checksum/config` and preserves the existing no-empty-annotations behavior.
- [ ] 3.2 Add an enabled-render assertion that finds exactly one `checksum/config` under the server Deployment's `spec.template.metadata`, never Deployment metadata, and verifies an arbitrary `server.podAnnotations` entry survives alongside it while a colliding custom checksum key cannot produce a duplicate or replace the computed value.
- [ ] 3.3 Add checksum dependency assertions: changing `timecalendar.crisp.websiteId` changes the extracted checksum, while changing `server.tag` leaves the extracted checksum unchanged.
- [ ] 3.4 Add a structural `envFrom` assertion that `configMapRef` remains first and `secretRef` second, and confirm the Helm template warning itself does not appear in rendered output.
- [ ] 3.5 Assert that enabling the server checksum leaves the `web-deployment.yaml` render byte-identical, then confirm the existing `test-chart` CI job already invokes `./ci/test-timecalendar-chart.sh`; do not edit `.github/workflows/ci-build-deploy.yml` unless the assertion is otherwise unreachable, and flag that additional sensitive surface if an edit becomes necessary.

## 4. Prove the live-values merge remains inert

- [ ] 4.1 Render the implemented chart with the gate omitted and explicitly false against the saved production and preproduction values. Diff each result against its task 1 baseline and require byte-identical output plus equal SHA-256 digests; record the platform commit and digest pairs in the PR body and handoff.
- [ ] 4.2 Render the chart with `server.configMapChecksumEnabled=true` against both platform values files and require exactly one added `checksum/config` line under the server pod template, with no other rendered-object delta and no annotation on `timecalendar-web`.
- [ ] 4.3 For an enabled environment render, vary only `timecalendar.crisp.websiteId` and prove the checksum changes; then vary only `server.tag` and prove the checksum remains equal even though the server image reference changes.
- [ ] 4.4 Compare bare chart renders from `origin/main` and the implementation with the gate omitted. Require byte-identical output, demonstrating that the `envFrom` warning is source-only and the default checksum path contributes no whitespace.

## 5. Local green and specification validation

- [ ] 5.1 Run `helm lint k8s/timecalendar` and record the successful as passing.
- [ ] 5.2 Run `./ci/test-timecalendar-chart.sh` and record every existing and new chart assertion as passing; this is the focused CI proof test for the change.
- [ ] 5.3 Run `openspec validate add-opt-in-configmap-checksum-restart --strict` and resolve every validation error before handoff.

## 6. Documentation and architecture record

- [ ] 6.1 Re-read `docs/mobile/architecture-book/architecture.md`, the Definition of Done, the relevant decision log, and the migration working rules; record the Architecture Book/ADR update as N/A in the PR and handoff because this leaf server-chart fix establishes no reusable mobile rule or costly-to-reverse mobile decision.
- [ ] 6.2 Confirm `docs/agent-dev-environment.md` remains current because the existing chart test command and workflow wiring are unchanged. Update it only if implementation changes those durable facts.
- [ ] 6.3 If implementation details diverge from a load-bearing decision in this design, update the OpenSpec artifacts before continuing rather than leaving the PR description or specification stale.

## 7. Scope, sensitive-surface, and publication audit

- [ ] 7.1 Inspect `git diff --stat` and require implementation changes to be limited to `k8s/timecalendar/values.yaml`, `k8s/timecalendar/templates/server-deployment.yaml`, `ci/test-timecalendar-chart.sh`, and this change's OpenSpec artifacts. `k8s/timecalendar/templates/web-deployment.yaml` must have no diff.
- [ ] 7.2 Confirm there is no platform-values activation, live-cluster action, Secret checksum, ConfigMap data change, image/replica/probe/resource change, API/generated-client change, migration, native/store configuration, Terraform, workflow, or legacy Flutter edit.
- [ ] 7.3 Flag `k8s/` in the PR body and every downstream handoff, state that the implementation merges inert and [TIM-314](/TIM/issues/TIM-314) owns activation, and state that Secret-only rotations remain outside this mechanism.
- [ ] 7.4 Run the repository disclosure scan against the complete diff, commit message, PR title, and PR body before each publication step; resolve every finding before pushing or editing public GitHub content.

## 8. QA disposition

- [ ] 8.1 Record `QA: none`: this has no user-visible surface, and the focused Helm render/digest evidence is the acceptance proof.
