## 1. Capture the runtime baseline

- [x] 1.1 Before editing the chart, render only `templates/server-configmap.yaml` with `environment=production` and with `environment=preprod`; parse each YAML document and save a canonical serialized object plus its SHA-256 hash in `$PAPERCLIP_RUN_SCRATCH_DIR` (or another run-owned scratch directory). Do not read or print any secret value.
- [x] 1.2 Confirm the two baseline objects contain the current ConfigMap fields and `data:` keys; record both baseline hashes for the final PR/handoff evidence.

## 2. Replace the Redis isolation note

- [x] 2.1 In `k8s/timecalendar/templates/server-configmap.yaml`, replace only the open “Confirm that isolation holds” comment with the verified contract: sealed `REDIS_URL` owns isolation by logical DB index (or separate instance), production uses DB 0, and preproduction uses DB 1.
- [x] 2.2 Name `lyrolab/platform/kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-production/env-sealed-secret.yaml` and the corresponding `timecalendar-preprod` path as the configuration source; require a distinct DB index or instance for any new environment before deployment and direct operators to verify it with `printenv REDIS_URL` inside the pod.
- [x] 2.3 Preserve the statement that `REDIS_KEY_PREFIX` is retired, keep the [TIM-143](/TIM/issues/TIM-143) reference, and add the [TIM-294](/TIM/issues/TIM-294) incident reference. Do not expose a Redis hostname, credential, or complete URL.

## 3. Prove the ConfigMap object is byte-identical

- [x] 3.1 Re-render the server ConfigMap for `environment=production`, parse and canonically serialize it with the same tool and options as task 1.1, and use `cmp` plus SHA-256 to prove its bytes and hash exactly match the production baseline.
- [x] 3.2 Repeat the byte/hash equality proof for `environment=preprod` against the preproduction baseline.
- [x] 3.3 Inspect `git diff -- k8s/timecalendar/templates/server-configmap.yaml` and confirm every changed line is YAML comment text: no field, `data:` key, template expression, chart value, or whitespace outside the note changed.

## 4. Local green and CI proof

- [x] 4.1 Run `helm lint k8s/timecalendar` and `./ci/test-timecalendar-chart.sh`; both must pass locally. The latter is the exact focused proof run by the existing `Test Helm chart` CI job, so no new test or workflow edit is in scope.
- [ ] 4.2 After pushing the implementation commit, confirm the PR-head `Test Helm chart` check succeeds and record its result with the production/preproduction hashes in the handoff.
- [x] 4.3 Run `openspec validate document-redis-logical-db-split` and record the exact result. Human/device QA is N/A because the parsed Kubernetes object is unchanged.

## 5. Architecture and sensitive-surface audit

- [x] 5.1 Evaluate the mobile Architecture Book and decision log against the final implementation; record the update as N/A in the PR/handoff because this infrastructure comment correction establishes no mobile rule and makes no costly-to-reverse architectural decision.
- [x] 5.2 Confirm the final implementation diff touches only the comment in `k8s/timecalendar/templates/server-configmap.yaml`; explicitly flag `k8s/` as the sole sensitive surface and confirm there are no changes to `openapi/openapi.json`, `mobile/src/api/generated/`, `server/src/migrations/`, mobile native/store config, Terraform, `.github/workflows/`, or legacy `app/`.
