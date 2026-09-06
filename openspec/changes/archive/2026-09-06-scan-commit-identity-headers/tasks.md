## 1. Lock the regression with black-box fixtures

- [x] 1.1 Add an end-to-end test in `ci/disclosure-scan.test.mjs` that creates a temporary base and
  branch, places a runtime-assembled matching value in a branch commit header, invokes `main`, and
  proves the scan exits non-zero with `source: "commit-header"`; run it against the unchanged
  scanner first and record that it fails for the missing lane.
- [x] 1.2 Extend the repository fixture across author name, author email, committer name, and
  committer email, asserting field-specific safe locations, complete occurrence counts, and that
  neither serialized findings nor captured output contains the assembled matched value.
- [x] 1.3 Add the two scope/control directions to the repository suite: a matching header only on
  the base must pass, while branch commits using the healthy automation identity set must pass
  without a header finding; keep a matching commit-message assertion to prove the two source values
  remain distinct.
## 2. Extend the repository CI gate

- [x] 2.1 Refactor the existing merge-base-to-head commit collection in
  `ci/disclosure-scan.mjs` to enumerate hashes from one authoritative range and structurally parse
  the four identity fields and message body from each raw commit object, including merge commits;
  preserve empty fields and existing commit-message behavior without delimiter framing that
  identity headers can collide with.
- [x] 2.2 Emit one baseline-free `commit-header` record per non-empty identity field with a location
  containing only the abbreviated hash and fixed field label, then pass it through the existing
  derived, structural, and configured matchers.
- [x] 2.3 Update scanner summaries/types/comments only where needed to include commit headers;
  confirm the lane never reads `ci/disclosure-baseline.json`, never uses `creditPaths`, and never
  prints a raw header value.
- [x] 2.4 Run the focused header tests after implementation and confirm all four matching-field
  cases fail the scan, the base-only fixture stays clean, and the healthy fixture is silent.

## 3. Record the intentional CI-only boundary

- [x] 3.1 Record that contributor-preflight implementation, tests, and materialization are declined,
  not deferred. The repository CI gate is the complete shipped scope, and the intentional asymmetry
  is captured in the delta spec so it is not re-filed as a parity defect.

## 4. Documentation and architecture record

- [x] 4.1 Update `docs/agent-dev-environment.md` so the current disclosure-gate contract lists
  branch commit author/committer names and emails, the `commit-header` source, the permanent
  merge-base-only boundary, and the baseline/`publishedIn` non-applicability.
- [x] 4.2 Complete the Architecture Book assessment: this changes repository and CI tooling rather
  than `mobile/`, so leave the Architecture Book and ADR log unchanged and record that N/A decision
  in the implementation handoff.
- [x] 4.3 Re-check the sensitive surface after implementation. Keep
  `.github/workflows/ci-build-deploy.yml` unchanged if its existing full-history checkout, scanner
  test step, and gate invocation already exercise the lane; if a change is proven necessary, limit
  it to the scan job and change no trigger, build, deploy, or unrelated step.

## 5. Local-green and CI proof

- [x] 5.1 Run `node --test ci/disclosure-scan.test.mjs` and confirm the black-box matching-header
  test is the CI proof: it fails without the lane, passes with it, and is executed by the existing
  scan job before the gate.
- [x] 5.2 Run `node ci/disclosure-scan.mjs --check-baseline` and a clean branch scan against the
  current merge base; confirm no baseline file or allowlist change was needed.
- [x] 5.3 Validate the OpenSpec change with `openspec validate scan-commit-identity-headers`, then
  update task checkboxes and the operating documentation to match the implementation that actually
  landed.
- [x] 5.4 Run the contributor disclosure preflight over the finished branch and exact PR text using
  the committed baseline and full runtime pattern list. Stop on every introduced finding; report
  only safe pattern ids, paths, and counts for any pre-existing finding.
