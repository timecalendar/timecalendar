## Why

The disclosure baseline invariant correctly fails when a committed CI pin exceeds the current
measurement, but the only generator currently replaces the whole CI lane. After a legitimate
occurrence removal, that full regeneration can also pin unrelated new findings, leaving contributors
with no generated, non-increasing way to accept only the reduction.

This change restores convergence without weakening either disclosure layer: a dedicated generator
mode will reduce or remove only keys that are already committed, while new and increased findings
remain unpinned and continue to fail closed.

## What Changes

- Add a `--converge-baseline` CLI mode alongside the deliberate full
  `--generate-baseline` mode.
- Generate a complete version-1 baseline that preserves `entries` exactly and reconciles
  `ciEntries` only for committed `(path, id)` keys: retain equal counts, lower reduced counts,
  remove zero-count keys, retain the committed count when measurement is higher, and omit every
  newly measured key.
- Keep canonical ordering and formatting shared with full baseline generation so convergence output
  is deterministic and reviewable as generator output.
- Keep `--check-baseline`, whole-file count enforcement, and the baseline-free added-line, path,
  rename, and commit-metadata checks unchanged.
- Add focused unit and end-to-end coverage for every convergence branch, including a stale baseline
  that fails before convergence and passes against the generated candidate.
- Document the reduction-only maintenance command and its boundary in the repository environment
  guide.

Out of scope are changes to detector semantics, allowlists, configured patterns, workflows,
`ci/disclosure-baseline.json` on this repair branch, product code, and any external pipeline
tooling. The product branch that exposed the stale pin will consume the new mode only after this
repair lands.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `disclosure-gate`: Extend the generated-baseline contract with a reduction-only
  convergence mode that cannot add or raise CI pins and leaves both enforcement layers unchanged.

## Impact

- Affected repository code: `ci/disclosure-scan.mjs` and `ci/disclosure-scan.test.mjs`.
- Affected documentation: `docs/agent-dev-environment.md` and the existing `disclosure-gate`
  specification.
- No API contract, generated client, database schema, native/store configuration, deploy
  configuration, or legacy Flutter code changes.
- Sensitive surface: the disclosure scanner and its public CI output are security-sensitive. The
  implementation and review must continue to emit only paths, safe ids, and counts, never matched
  text. No enumerated product/deploy sensitive surface is touched, and `.github/workflows/` remains
  out of scope.
