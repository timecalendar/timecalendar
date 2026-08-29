## Why

The chart still asks deployers to confirm Redis isolation even though the production/preproduction split has now been established and verified after a shared logical DB caused the queue collision tracked in [TIM-294](/TIM/issues/TIM-294). The note should record the checkable operating fact so future environments cannot mistake the retired `REDIS_KEY_PREFIX` for an isolation boundary.

## What Changes

- Replace the open-ended isolation warning beside `REDIS_KEY_PREFIX` with the verified sealed-`REDIS_URL` contract: production uses logical DB 0 and preproduction uses logical DB 1.
- Point operators to the source-of-truth sealed-secret paths in `lyrolab/platform`, require a unique logical DB index or Redis instance before any new environment is deployed, and make in-pod `printenv REDIS_URL` the verification method.
- Retain the retirement note for `REDIS_KEY_PREFIX` and reference [TIM-143](/TIM/issues/TIM-143) and [TIM-294](/TIM/issues/TIM-294).
- Prove that the parsed server ConfigMap is byte-identical before and after the comment edit for both production and preproduction renders.
- Keep every ConfigMap `data:` key, chart value, platform manifest, and live-cluster resource unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `timecalendar-chart-runtime-config`: The chart's Redis configuration note records the verified production/preproduction logical-DB isolation contract and the live-pod verification required for future environments, while leaving the rendered ConfigMap object unchanged.

## Impact

- **Affected file:** `k8s/timecalendar/templates/server-configmap.yaml` comment text only.
- **Sensitive surface:** `k8s/` is deployment infrastructure; the PR and handoff must flag it even though no runtime manifest field changes.
- **Verification:** render the server ConfigMap for `environment=production` and `environment=preprod`, parse each YAML document to remove comments as Kubernetes does, and compare canonical serialized bytes/hashes against `origin/main`.
- **No effect:** no chart values, ConfigMap `data:` keys, platform repository, live cluster, API/OpenAPI contract, generated mobile client, database migration, native/store config, Terraform, CI workflow, or legacy Flutter change.
