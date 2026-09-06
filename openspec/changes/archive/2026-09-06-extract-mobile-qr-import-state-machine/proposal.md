## Why

The QR scanner currently owns camera presentation, import concurrency, retry state, lifecycle
safety, error recording, draft cleanup, and navigation in one 381-line component. Extracting the
transition logic now makes the backend-failure recovery contract easier to review and
protect without changing what students see or how imports behave.

## What Changes

- Move valid-scan capture, synchronous duplicate exclusion, import execution, retry, scan-another,
  manual-entry, completion, and disposal transitions into a focused QR-import controller/state
  machine.
- Split camera permission/scanner, progress, success, and failure presentation into cohesive views;
  keep every component materially below 200 lines.
- Preserve the captured normalized URL and captured import fields across failures and retries,
  exactly-once success cleanup/navigation, invalid-payload re-arming, and no effects after unmount.
- Expand focused tests around controller transitions and screen integration, including rapid
  duplicate inputs and both late resolve and late reject after unmount.
- Classify React Doctor's `attempt` finding from the resulting code and evidence: remove
  render-driving attempt state only if the controller does not need it to render or retry.
- Keep existing translations, accessibility semantics, test IDs, feature barrels, and dependency
  direction unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-qr-scan`: Require explicit transition ownership and decomposed presentation while
  retaining the existing QR import, retry, concurrency, observability, and lifecycle behavior.

## Impact

- Affected production code is limited to `mobile/src/features/calendar-sources/ui/`, with focused
  tests colocated in that feature. Public route and feature-barrel shapes remain stable.
- No API or data-model change, dependency addition, migration, native configuration, store/EAS or
  Firebase configuration, deployment/CI change, or legacy Flutter change is expected.
- The binding Architecture Book already describes the required behavior and is not changed. If
  implementation discovers that its rule must change, Apply must stop and flag the exact expansion;
  that would require Architecture Book and ADR treatment before proceeding.
