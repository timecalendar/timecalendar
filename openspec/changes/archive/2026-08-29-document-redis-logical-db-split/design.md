## Context

The Redis block in `k8s/timecalendar/templates/server-configmap.yaml` correctly says that `REDIS_KEY_PREFIX` was retired by [TIM-143](/TIM/issues/TIM-143), but it still leaves Redis isolation as a pre-deploy confirmation. That open action was not completed when preproduction and production shared logical DB 0, allowing both environments to use the same unprefixed BullMQ queue ([TIM-294](/TIM/issues/TIM-294)).

The prerequisite rollout is now complete: the sealed `REDIS_URL` under `lyrolab/platform/kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-production/env-sealed-secret.yaml` selects DB 0, the corresponding `timecalendar-preprod` secret selects DB 1, and [TIM-300](/TIM/issues/TIM-300) verified the preproduction value from the running pod. This change records that state in the chart without changing the secret, values, or rendered Kubernetes object.

`k8s/` is a sensitive deployment surface. The implementation must therefore prove semantic manifest identity, even though its only source edit is YAML comment text.

## Goals / Non-Goals

**Goals:**

- Make the chart note state the verified production DB 0 / preproduction DB 1 split and where that split is configured.
- Make the safe procedure for a new environment explicit: allocate its own logical DB index or Redis instance before deployment, then inspect `REDIS_URL` inside the running pod.
- Preserve the `REDIS_KEY_PREFIX` retirement explanation and its [TIM-143](/TIM/issues/TIM-143) reference.
- Prove that production and preproduction ConfigMap objects are unchanged.

**Non-Goals:**

- Editing any ConfigMap `data:` key, chart value, sealed secret, platform manifest, or live-cluster resource.
- Re-verifying or changing the already-completed Redis rollout.
- Adding a chart test, CI workflow step, Architecture Book rule, or ADR for a comment-only leaf correction.

## Decisions

## Decision 1 — Treat the sealed `REDIS_URL` and live pod environment as the isolation boundary

The note will name the current allocation—production DB 0 and preproduction DB 1—and the platform sealed-secret path that owns it. It will require each future environment to receive either a distinct logical DB index or a distinct Redis instance before deployment. The operational check is `printenv REDIS_URL` inside the pod because the sealed manifest is encrypted and cannot demonstrate the value actually injected into a running workload.

Alternative: retain the generic “confirm isolation” warning. Rejected because it is an unowned action rather than a checkable current-state contract, and the resulting ambiguity already contributed to [TIM-294](/TIM/issues/TIM-294).

Alternative: restore or document `REDIS_KEY_PREFIX` as the boundary. Rejected because `nest-shared` connects BullMQ and Redis by `REDIS_URL` without applying that retired prefix; documenting otherwise would be false.

## Decision 2 — Compare parsed ConfigMap bytes, not raw Helm text

The before/after proof will render `templates/server-configmap.yaml` for `environment=production` and `environment=preprod`, parse each YAML document, serialize the object canonically, and compare the resulting bytes and SHA-256 hashes against an `origin/main` baseline. YAML comments are discarded by the parser exactly as they are before Kubernetes receives the object, so any `metadata` or `data` drift changes the canonical bytes and fails the comparison.

Alternative: hash raw `helm template` output. Rejected because the requested source comment is emitted in Helm's YAML text, so a correct documentation edit necessarily changes that raw byte stream even though the Kubernetes ConfigMap is identical.

Alternative: inspect only the `data:` block by eye. Rejected because it is weaker than comparing the complete parsed ConfigMap object and does not produce durable hashes for both environments.

## Risks / Trade-offs

- **[The note becomes stale if platform allocation changes]** → Name the platform sealed-secret paths and the live-pod command so an operator can check and update the statement when allocations move.
- **[A secret URL could leak into logs]** → Verification compares canonical manifest objects only; it never reads or prints sealed-secret contents or live credentials. The note records DB indices, not credential material.
- **[A source-only review misses runtime drift]** → Capture parsed-object SHA-256 hashes for both environments before and after, run `helm lint`, and run the existing `ci/test-timecalendar-chart.sh` CI proof locally.

## Migration Plan

1. Capture canonical parsed ConfigMap hashes from `origin/main` for production and preproduction renders.
2. Replace only the Redis note in `server-configmap.yaml`.
3. Re-render both environments and require exact canonical byte/hash equality with the baselines.
4. Run Helm lint and the existing chart CI proof, then inspect the final diff for comment-only scope.

No rollout or data migration is required. Rollback is a direct revert of the comment edit; it has no runtime effect.

## Open Questions

None. The allocation, source of truth, live verification command, and scope are fixed by the completed rollout.
