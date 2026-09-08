## Why

The portrait-tablet quick-wins epic needs one integrated record after its foundation and route-polish workstreams land. Native regression also exposed keyboard and alert-selector gaps that could hide phone regressions even when component-level responsive checks passed.

## What Changes

- Reconcile every route in the tablet quick-wins matrix with shipped behavior and focused phone/tablet evidence.
- Measure keyboard-safe forms in window coordinates and keep their action region inside the unobscured height on both platforms.
- Preserve the three-journey native smoke architecture while making the personal-event alert confirmation target the hierarchy each platform actually exposes.
- Lock the selector geometry and keyboard behavior with deterministic Jest and harness coverage.
- Keep routes, persistence, API contracts, native configuration, dependencies, generated clients, migrations, and the legacy application unchanged.

## Capabilities

### New Capabilities

- `mobile-tablet-regression`: final route-matrix reconciliation and integrated regression requirements for supported phone and full-screen portrait-tablet surfaces.

### Modified Capabilities

<!-- none -->

## Impact

- **Documentation:** `docs/mobile/tablet-quick-wins.md` records the implemented disposition and evidence for every audited route.
- **Production UI:** the shared keyboard-safe action layout derives its native offset from its measured window position so form actions remain reachable.
- **Native evidence:** the budgeted personal-event journey distinguishes the alert confirmation from the editor action on Android and iOS.
- **Contracts and configuration:** no API, database, dependency, native/store, generated-client, or deployment-contract change.
