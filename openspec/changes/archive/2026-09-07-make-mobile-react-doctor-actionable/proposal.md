## Why

React Doctor is currently an ad hoc command whose version, project boundary, and reporting options vary between runs, so its findings cannot serve as a dependable mobile quality signal. A fresh React Doctor 0.9.13 scan of the standalone Expo project now reports 93 diagnostics across 44 files (5 errors and 88 warnings), and the remaining debt needs durable classification plus a regression guard that does not charge unrelated changes for the existing baseline.

## What Changes

- Add reproducible full-project and changed-code React Doctor commands owned by `mobile/`, pinned to 0.9.13, scoped to the standalone Expo project, and run without telemetry, score reporting, or supply-chain results from sibling projects.
- Record a durable, reviewable diagnostic baseline under `docs/mobile/`, including per-rule counts, confirmed findings, false positives, evidence-backed deferrals, owners, and the proof that Next is not present in the mobile dependency tree.
- Investigate the current five React Compiler unsupported-syntax errors and the seven-error historical inventory; rewrite only behavior-preserving local patterns and retain explicit cleanup, failure-domain, single-flight, and observability semantics when a compiler-friendly rewrite would obscure them.
- Validate representative manual-memoization findings and classify every remaining warning without mass-removing `useMemo` or `useCallback` sites that preserve referential identity, dependency stability, or measured rendering behavior.
- Add a changed-code CI guard that rejects newly introduced, untriaged React Doctor warnings or errors relative to `origin/main` while leaving pre-existing full-project debt advisory.
- Capture final integration evidence for the seven prerequisite pull requests, before/after diagnostics, focused tests, TypeScript, lint, full Jest natural exit, and all deliberate deferrals.

## Capabilities

### New Capabilities

- `mobile-react-diagnostics`: Defines the reproducible mobile-only React Doctor workflow, durable classification baseline, evidence requirements, and changed-code regression gate.

### Modified Capabilities

None.

## Impact

- Expected areas: `mobile/package.json`, `mobile/package-lock.json`, focused mobile source/tests for safe compiler-bailout fixes, a new diagnostic report under `docs/mobile/`, and `.github/workflows/ci-mobile.yml` for the changed-code gate.
- Sensitive surface: `.github/workflows/ci-mobile.yml` may gain full-history checkout and one mobile diagnostic step so `origin/main` is a valid comparison base. The edit must not change triggers, native E2E, deployment, or production behavior.
- Sensitive surface: the binding diagnostic rule will update the relevant `docs/mobile/architecture-book/` topical guidance, changelog, and a conflict-free ADR. These edits describe the new current-state quality contract; they must not rewrite unrelated architecture rules.
- No OpenAPI contract/generated client, database migration, native/store/EAS/Firebase configuration, secrets path, deployment infrastructure, or legacy Flutter change is expected. No user-visible behavior, API, or stored-data migration is intended.
