## Why

The disclosure gate checks branch file content, paths, commit messages, and supplied publication
text, but it does not check the author and committer headers that are published with each commit.
That gap can silently attribute an automated change to a protected identity even when every
existing disclosure lane is green.

The merged scanner and baseline work now provide one converged policy to extend. The new lane must
remain limited to commits added by the branch: historical headers are accepted public authorship,
and scanning them would make the gate permanently noisy instead of detecting regressions.

## What Changes

- Inspect the author name, author email, committer name, and committer email of every commit in the
  merge-base-to-head range.
- Report matching header fields through a new `commit-header` source alongside the existing file,
  path, commit-message, and caller-text sources, without reproducing matched text.
- Apply layer-B semantics to commit headers: neither the count-keyed content baseline nor
  path-scoped published-identity narrowing can excuse a finding.
- Keep the contributor preflight and repository CI gate aligned on the same branch range, source
  semantics, redaction rule, and healthy-identity behavior.
- Add synthetic regression coverage for both a matching header and the healthy automation identity
  set, with no protected identity or denylist committed in fixtures.
- Document the commit-header lane and its permanent branch-only boundary next to the current
  disclosure-gate operating contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `disclosure-gate`: Extend branch publication scanning to author and committer headers while
  preserving redaction, layer-B enforcement, and parity between preflight and CI.

## Impact

- Repository scanner and tests: `ci/disclosure-scan.mjs`, `ci/disclosure-scan.test.mjs`.
- Contributor preflight: the externally maintained pre-publication scanner used before repository
  writes; its implementation and focused tests must change in lockstep with the CI lane.
- Operator documentation: `docs/agent-dev-environment.md`.
- **Sensitive surfaces:** `ci/` and the unskippable scan job in
  `.github/workflows/ci-build-deploy.yml`. The workflow invocation should remain sufficient; if it
  must change, no trigger, build, deploy, or unrelated step may change.
- No API contract, generated client, database schema, mobile native/store configuration,
  infrastructure, or legacy Flutter code changes.
- No new dependency and no committed pattern list. The existing runtime pattern sources continue
  to define what matches.

## Non-Goals

- Scanning or rewriting repository history.
- Adding or changing disclosure patterns, baseline counts, published-identity paths, or allowlist
  policy.
- Changing commit creation, repository credentials, or host identity configuration.
- Changing pull-request authorship or comment authorship checks.
