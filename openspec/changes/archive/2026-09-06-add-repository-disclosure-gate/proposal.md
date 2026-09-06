## Why

The public repository needs an unskippable control that rejects newly published identifying material. Written guidance alone cannot reliably catch accurate but unsafe identity or authentication details before merge.

## What Changes

- Add a CI disclosure scan over added lines, published file paths, and branch commit messages.
- Combine repository-history-derived identities, structural patterns, and optional configured regular expressions without committing a denylist.
- Fail closed on invalid configured expressions or failed pattern probes while reporting only safe location and pattern-class metadata.
- Document the operator contract and keep narrowly scoped benign exemptions reviewable in a committed allowlist.

## Capabilities

### New Capabilities

- `repository-disclosure-gate`: Defines the public-repository publication surfaces, layered pattern sources, safe reporting, configured-pattern probes, and exemption boundaries.

### Modified Capabilities

None.

## Impact

- CI workflow: `.github/workflows/ci-build-deploy.yml`
- Scanner and behavioral tests: `ci/disclosure-scan.mjs`, `ci/disclosure-scan.test.mjs`
- Benign-value allowlist: `ci/disclosure-allowlist.json`
- Operator handbook: `docs/agent-dev-environment.md`
