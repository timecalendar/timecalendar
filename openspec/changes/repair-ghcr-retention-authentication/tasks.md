## 1. Lock the retention configuration contract

- [x] 1.1 Add a focused dependency-free check under `ci/` that scopes assertions to the
  `clean-ghcr` job and each retention-action step, and rejects missing daily scheduling, missing or
  extra package invocations, a PAT reference, broader/missing permissions, a caller-controlled
  dry-run value, a changed cut-off fallback, missing protected tags, or a floor below five; run it
  against the unchanged workflow first and record the expected failure.
- [x] 1.2 Add focused negative fixtures or self-tests for any nontrivial block parser used by the
  check, proving that matching words in comments or in the other package's step cannot satisfy an
  invariant.
- [x] 1.3 Wire the focused check into an always-on, non-deploying baseline job in
  `.github/workflows/ci-build-deploy.yml`, then verify that the job has no package credential and
  does not contact GHCR.

## 2. Repair the workflow authentication and safety boundary

- [x] 2.1 Give `clean-ghcr` only job-level `packages: write`; remove the stored PAT reference and
  configure the server package's `snok/container-retention-policy@v2` step with its exact name,
  `${{ github.token }}`, and `token-type: github-token`.
- [x] 2.2 Add a separate, visibly named v2 invocation for the exact web package name with the same
  workflow-token mode, organization account inputs, and cut-off expression; do not combine names or
  use a wildcard.
- [x] 2.3 In both package steps preserve `keep-at-least: 5` and `skip-tags: latest, production`, and
  set `dry-run` solely from `github.event_name == 'workflow_dispatch'` so schedules remain effective
  while every manual dispatch is non-destructive.
- [x] 2.4 Re-run the focused check and validate YAML syntax and v2 action input names with a pinned
  `actionlint` release (installed only in the run scratch directory when absent); record the version
  and commands without recording any credential or request header.

## 3. Document the operating contract

- [x] 3.1 Update `docs/agent-dev-environment.md` to describe the repository-token authentication,
  two exact-name invocations, scheduled deletion versus forced manual dry-run behavior, retained
  cut-off input, protected tags/version floor, and the focused local validation command.
- [x] 3.2 Complete the Architecture Book/ADR assessment: because this changes repository automation
  rather than reusable `mobile/` architecture, leave the Architecture Book, its changelog, and ADR
  log unchanged and record that N/A decision in the implementation handoff.
- [x] 3.3 Re-read the diff for sensitive-surface scope: only the retention workflow, its baseline CI
  proof, focused checker/tests, agent handbook, and this OpenSpec change may be touched; no app,
  deploy, package-publication, infrastructure, credential, or legacy Flutter surface may change.

## 4. Local-green and specification verification

- [x] 4.1 Run the focused retention check and its negative/self-test cases, and confirm the valid
  workflow passes without contacting GitHub or loading secrets.
- [x] 4.2 Run `openspec validate repair-ghcr-retention-authentication --strict` and update these
  checkboxes and artifacts to match the implementation that actually landed.
- [x] 4.3 Run the repository disclosure scan over the complete branch and exact PR text using the
  committed baseline and runtime pattern list; stop and scrub any introduced finding before push.

## 5. Exact-head CI and non-destructive live proof

- [x] 5.1 Commit and push the implementation head, then obtain green pull-request CI for that exact
  SHA, including the new focused retention-contract job; do not treat skipped, pending, or older-head
  checks as proof.
- [x] 5.2 Dispatch `delete-old-images.yaml` once against that branch ref with an explicit
  timezone-aware cut-off, verify from the run event/config that both steps are forced dry-run, and
  confirm both exact package steps complete version-list processing successfully without a deletion.
  Record only the public run URL, tested head SHA, step conclusions, and sanitized outcome.
- [x] 5.3 If either package returns an authorization failure, stop and block the issue naming the
  package and the required repository `admin` grant in its Actions access settings. If organization
  policy prohibits that grant, return for design revision specifying a dedicated classic token held
  by a package-admin identity, stored as an Actions secret, and limited to `read:packages` plus
  `delete:packages`; never inspect, create, rotate, or print the token.
- [x] 5.4 Before handing to review, re-check that the PR head still equals the CI and dry-run head. If
  a later stage changed the workflow or validation code, repeat the exact-head CI and safe branch
  dry-run proofs.
