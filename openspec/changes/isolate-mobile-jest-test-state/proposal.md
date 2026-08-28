## Why

Four mobile Jest suites rely on their current declaration order: tests leave React `act` work, queued mock implementations, spies, or MMKV preferences alive long enough for a later test to observe them. Jest's `--randomize` mode exposes 15 failures at seed 7, so adding or reordering a test can produce a misleading flake even though the shipped baseline order stays green.

## What Changes

- Make every asynchronous React Native Testing Library interaction in the four affected suites complete before its test returns.
- Tear down each suite's owned mock implementations, one-shot response queues, spies, and persisted preference state in `afterEach`, including when a test throws.
- Keep assertions and production behavior unchanged; retain the real generated TanStack hooks and the existing `customFetch` test seam.
- Document the mobile unit-test isolation rule and verify the four suites across randomized seeds before running representative whole-suite randomization and the coverage baseline.
- Keep CI workflow randomization, Jest-wide reset/restore configuration, and the per-test time budget outside this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-test-harness`: Require colocated mobile tests to await asynchronous testing-library helpers and tear down suite-owned mutable state so test results do not depend on declaration order.

## Impact

- Affected tests: calendar sync, notification subscription registration, timezone settings UI, and add-calendar data-hook suites under `mobile/src/features/`.
- Documentation: `docs/mobile/architecture-book/testing.md` and its changelog entry.
- APIs, generated clients, database schema, runtime dependencies, production code, native/store configuration, CI workflows, and legacy Flutter are unchanged.
- Sensitive surfaces touched: none.
