## Why

The real-server Activity journey reaches only fixture rows 24–27 before Maestro's single
60-second iOS `scrollUntilVisible` command expires, while the first-page tie-order proof is at row
50. Two exact-head iOS runs fail at the same point even though the imported rows, unread state,
navigation assertions, and server seed are correct, so the native proof needs a deterministic way
to traverse the intentionally virtualized, one-log-per-group timeline without weakening its
ordering or pagination contract.

## What Changes

- Add a positive midpoint checkpoint in the existing Activity Maestro journey before the
  first-page tie-higher row, splitting the long iOS traversal into two bounded scroll legs.
- Keep the existing tie-higher, tie-lower, and older-page-anchor assertions intact and ordered, so
  the journey still proves `createdAt DESC, id DESC` across the 50-row page boundary and still
  requires the real older-page response.
- Extend the focused Activity Maestro selector regression test to require the midpoint checkpoint
  before the tie assertions and to reject shortcuts that make any of those observations optional.
- Record the diagnosed iOS traversal constraint in the mobile E2E fixture documentation without
  changing app behavior, page size, retry policy, workflow configuration, or backend lifecycle.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: the Activity real-server journey must traverse a long virtualized first page through
  deterministic positive checkpoints before asserting the timestamp-tie pair and older-page anchor.

## Impact

- Affected files are limited to `mobile/.maestro/activity.yaml`,
  `mobile/e2e/activity-maestro-selectors.test.ts`, and `mobile/e2e/README.md`.
- No React Native product code, API contract, generated client, server schema, dependency, native
  configuration, CI workflow, backend lifecycle, or legacy Flutter file changes.
- Sensitive surfaces touched: none. All sensitive surfaces named by the ticket remain out of scope,
  including `docs/mobile/architecture-book/`.
- Definitive proof remains the existing `Run mobile E2E (iOS)` job on the exact implementation SHA;
  the host has no local iOS simulator.
