## 1. Capture the pre-change baseline first

- [x] 1.1 Before editing anything, materialise the `origin/main` chart and the real
  per-environment values, and record the baseline digests. `lyrolab/platform` is checked
  out locally at `/home/dev/projects/perso/platform`; fetch it so the values come from
  `origin/main`, and record the platform commit alongside the digests.

  ```bash
  S="${PAPERCLIP_RUN_SCRATCH_DIR:-/tmp}/tim337-render"; mkdir -p "$S"
  git fetch origin
  git archive origin/main k8s/timecalendar | tar -x -C "$S"          # -> $S/k8s/timecalendar
  PLAT=/home/dev/projects/perso/platform
  git -C "$PLAT" fetch origin && git -C "$PLAT" rev-parse --short origin/main
  for e in preprod production; do
    git -C "$PLAT" show "origin/main:kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-$e/values.yaml" > "$S/$e.yaml"
    helm template timecalendar "$S/k8s/timecalendar" -f "$S/$e.yaml" > "$S/before-$e.yaml"
  done
  sha256sum "$S/before-preprod.yaml" "$S/before-production.yaml"
  ```

  Paste both digests and the platform commit into the handoff. A baseline captured *after*
  the edit proves nothing.

## 2. Add the pod-annotation mechanism

- [x] 2.1 In `k8s/timecalendar/templates/server-deployment.yaml`, add the annotations block
  to `spec.template.metadata`, above `labels:` — **not** to the Deployment's own
  `metadata:`:

  ```yaml
    template:
      metadata:
        {{- with .Values.server.podAnnotations }}
        annotations:
          {{- toYaml . | nindent 8 }}
        {{- end }}
        labels:
  ```

  The `with` guard is load-bearing: an empty map must render *nothing*, not
  `annotations: {}` (design Decision 1).
- [x] 2.2 In `k8s/timecalendar/values.yaml`, add `podAnnotations: {}` under `server:`
  alongside `replicaCount`/`tag`, with a comment that says: setting or changing any key
  here rolls the server pods on the next ArgoCD sync; this is the supported way to apply a
  change to a Secret consumed through `envFrom` (`timecalendar-env-secret`); the value is
  written per environment in `lyrolab/platform`, never here. Keep the comment on the values
  key only — a `#` comment inside a template renders into the manifest, so it must not go
  into `server-deployment.yaml`'s output path.
- [x] 2.3 Do not touch `templates/web-deployment.yaml`, any ConfigMap key, any secret, or
  any other chart file.

## 3. Extend the committed CI proof

- [x] 3.1 In `ci/test-timecalendar-chart.sh`, add assertions alongside the existing
  queue-concurrency checks, using `helm template --show-only` to isolate each Deployment
  (design Decision 5):
  - bare `--show-only templates/server-deployment.yaml` render contains **no**
    `annotations:` line;
  - with `--set-string server.podAnnotations.tim337=stamp`, the server render differs from
    the bare server render by exactly two added lines, the first being `annotations:` and
    the second `tim337: "stamp"`, and the `annotations:` line is indented as a pod-template
    key (6 spaces), not as Deployment `metadata` (2 spaces);
  - `--show-only templates/web-deployment.yaml` renders identically with and without
    `server.podAnnotations` set.
  Keep the script's existing style: `set -euo pipefail`, bash + `grep`/`diff`, no new
  dependency, and a failure message that names the expectation.
- [x] 3.2 Confirm no change is needed to `.github/workflows/ci-build-deploy.yml` — the
  `test-chart` job already runs `./ci/test-timecalendar-chart.sh` with pinned Helm v3.16.4.
  If a workflow edit turns out to be needed, keep it to that job and flag it as a second
  sensitive surface in the PR body and every handoff.

## 4. Prove the default is inert (the acceptance gate)

- [x] 4.1 Render the implementation against the same two environment values files and
  compare with the task 1.1 baseline:

  ```bash
  for e in preprod production; do
    helm template timecalendar k8s/timecalendar -f "$S/$e.yaml" > "$S/after-$e.yaml"
    diff "$S/before-$e.yaml" "$S/after-$e.yaml" && echo "$e: identical"
  done
  sha256sum "$S"/before-*.yaml "$S"/after-*.yaml
  ```

  Both `diff`s must be empty and each `before`/`after` digest pair must be equal. Quote the
  four digests verbatim in the PR body and the handoff — this is the check the Reviewer
  re-runs.
- [x] 4.2 Confirm the bare chart is also unchanged:
  `diff <(helm template timecalendar "$S/k8s/timecalendar") <(helm template timecalendar k8s/timecalendar)`
  must be empty.
- [x] 4.3 Prove the stamped render changes exactly the intended two lines and nothing else:

  ```bash
  helm template timecalendar k8s/timecalendar -f "$S/production.yaml" \
    --set-string 'server.podAnnotations.timecalendar\.app/restarted-at=2026-10-06T12:00:00Z' \
    > "$S/stamped-production.yaml"
  diff "$S/after-production.yaml" "$S/stamped-production.yaml"
  ```

  Expect exactly two added lines, inside the **server** Deployment's
  `spec.template.metadata`. Show the surrounding rendered lines in the handoff so the
  placement is visible, not asserted.
- [x] 4.4 Confirm the web Deployment is byte-identical in the stamped render:
  compare `helm template … --show-only templates/web-deployment.yaml` with and without the
  `--set-string`, and confirm `git diff --stat` lists no change to
  `k8s/timecalendar/templates/web-deployment.yaml`.

## 5. Local green and validation

- [x] 5.1 `helm lint k8s/timecalendar` passes.
- [x] 5.2 `./ci/test-timecalendar-chart.sh` passes locally, including the new assertions.
- [x] 5.3 `openspec validate add-chart-server-pod-annotations --strict` passes. (Run it
  before handoff — the archive step is the only thing that validates delta headers, and it
  runs behind the merge gate.)

## 6. Documentation

- [x] 6.1 Mobile Architecture Book and decision log: record as **N/A** in the PR body and
  handoff. This is a server-chart leaf change that establishes no mobile rule and no
  costly-to-reverse mobile decision; do not add unrelated mobile documentation.
- [x] 6.2 `docs/agent-dev-environment.md`: update only if the chart CI invocation changes.
  Task 3.2 expects it does not — record as N/A if so.

## 7. Scope and sensitive-surface audit

- [x] 7.1 Read the final `git diff --stat`. The only files may be
  `k8s/timecalendar/templates/server-deployment.yaml`, `k8s/timecalendar/values.yaml`,
  `ci/test-timecalendar-chart.sh`, and this change's `openspec/` artifacts. Anything else
  is out of scope — including a shared worktree's stray files (`git status` before every
  commit; stage explicit paths, never `git add -A`).
- [x] 7.2 Confirm the diff contains no annotation *value*, no checksum annotation, no
  `REDIS_URL`, no credential, no new env key, no platform-repo edit, no Terraform, no
  OpenAPI/generated client, no migration, no mobile/native/store config, and no legacy
  Flutter change.
- [x] 7.3 Flag `k8s/` as a sensitive surface in the PR body and in every downstream handoff,
  and state explicitly that merging is not a deploy act because the default render is
  unchanged (evidence: task 4.1 digests).

## 8. QA

- [x] 8.1 `QA: none`. No human-visible surface; chart template only. The render digests are
  the evidence.
