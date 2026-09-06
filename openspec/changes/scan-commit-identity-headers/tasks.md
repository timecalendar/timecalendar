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
- [x] 1.4 Add equivalent focused regression cases to the canonical contributor-preflight test
  suite before changing that implementation, including branch-only scope, all four fields,
  redaction, healthy identities, and source separation.

## 2. Extend the repository CI gate

- [x] 2.1 Refactor the existing merge-base-to-head commit-log collection in
  `ci/disclosure-scan.mjs` to parse hash, four identity fields, and message body from one
  delimiter-safe record stream; preserve empty fields and existing commit-message behavior.
- [x] 2.2 Emit one baseline-free `commit-header` record per non-empty identity field with a location
  containing only the abbreviated hash and fixed field label, then pass it through the existing
  derived, structural, and configured matchers.
- [x] 2.3 Update scanner summaries/types/comments only where needed to include commit headers;
  confirm the lane never reads `ci/disclosure-baseline.json`, never uses `creditPaths`, and never
  prints a raw header value.
- [x] 2.4 Run the focused header tests after implementation and confirm all four matching-field
  cases fail the scan, the base-only fixture stays clean, and the healthy fixture is silent.

## 3. Keep the contributor preflight converged

- [x] 3.1 In the canonical contributor-preflight implementation, extend its existing branch log
  record to carry the same four identity fields alongside hash and body, using the already resolved
  merge-base-to-head range.
- [x] 3.2 Route each non-empty header field through the existing unnarrowed text matcher as
  `source: "commit-header"`, set `added: true`, and use only the safe abbreviated-hash/field label
  as the finding location; do not consult the baseline or `publishedIn`.
- [x] 3.3 Run the canonical preflight tests and a black-box `disclosure-scan` request against a
  synthetic branch, proving the same failing and healthy verdicts as CI and confirming the report
  redacts every assembled match.
- [ ] 3.4 Materialize the updated canonical preflight package through its normal versioned delivery
  path, verify the active executable carries the new behavior, and record the verified package
  revision in the internal handoff without adding environment details to the public repository.

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

- [ ] 5.1 Run `node --test ci/disclosure-scan.test.mjs` and confirm the black-box matching-header
  test is the CI proof: it fails without the lane, passes with it, and is executed by the existing
  scan job before the gate.
- [ ] 5.2 Run `node ci/disclosure-scan.mjs --check-baseline` and a clean branch scan against the
  current merge base; confirm no baseline file or allowlist change was needed.
- [ ] 5.3 Validate the OpenSpec change with `openspec validate scan-commit-identity-headers`, then
  update task checkboxes and the operating documentation to match the implementation that actually
  landed.
- [ ] 5.4 Run the contributor disclosure preflight over the finished branch and exact PR text using
  the committed baseline and full runtime pattern list. Stop on every introduced finding; report
  only safe pattern ids, paths, and counts for any pre-existing finding.
