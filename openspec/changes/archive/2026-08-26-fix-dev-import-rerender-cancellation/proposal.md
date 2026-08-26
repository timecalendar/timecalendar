## Why

The development calendar-import screen cancels its in-flight completion path whenever the mutation-derived `sync` callback changes identity during a rerender. The API work succeeds, but navigation is suppressed, leaving Android and iOS native E2E stuck on “Importing calendar…” instead of reaching the seeded calendar.

## What Changes

- Separate actual screen-unmount tracking from the import effect's ordinary dependency reruns.
- Preserve the once-per-mount import guard so a changed `sync` callback cannot start a second import.
- After a deferred first sync resolves, navigate to `/calendar` when the screen is still mounted; retain the existing mounted-only error-state update behavior.
- Add a focused component regression that rerenders with a replacement `sync` callback while the first callback is in flight, then proves navigation completes and the replacement callback is never invoked.
- Keep the existing dev-variant runtime gate, token persist chain, sync behavior, error reporting, and Maestro flow unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-import-token`: require an import already started on the mounted screen to survive dependency-driven rerenders, complete navigation after sync, and remain once per mount.

## Impact

- `mobile/src/features/calendar-sources/ui/dev-import-screen.tsx` — lifecycle bookkeeping only.
- `mobile/src/features/calendar-sources/ui/dev-import-screen.test.tsx` — deferred-sync callback-identity regression.
- No API contract, generated client, database schema, native/store/EAS configuration, Maestro flow, CI/workflow, infrastructure, deploy, secret, or legacy Flutter change.
- No binding Architecture Book rule or ADR changes; the fix applies existing React lifecycle and component-test guidance locally.
