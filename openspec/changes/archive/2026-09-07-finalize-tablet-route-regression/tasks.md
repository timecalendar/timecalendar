## 1. Reconcile the route inventory

- [x] 1.1 Inspect every route in `docs/mobile/tablet-quick-wins.md` against the merged tablet foundation and the scheduling, onboarding/calendar-source, and settings/utility workstreams.
- [x] 1.2 Replace proposed TIM-501 route dispositions with the shipped single-column lane ownership, preserved behavior, and focused phone/tablet evidence.
- [x] 1.3 Confirm all other rows remain accurate and record simulator, emulator, and physical-device evidence without claiming unavailable local execution.

## 2. Close the integrated Activity navigation gap

- [x] 2.1 Reproduce the proof gap with a focused static assertion that requires both actionable Activity fixture rows to use no-change tap retry and reach a details-only selector before seeded content is asserted.
- [x] 2.2 Update the shared Activity Maestro flow so new and changed rows use `retryTapIfNoChange: true`, wait for `event-details-responsive-owner`, and then assert their seeded details location.
- [x] 2.3 Keep the Activity production screen, row selectors, accessibility labels, data/cache semantics, paging, refresh, native configuration, and fixtures unchanged.

## 3. Verification and delivery

- [x] 3.1 Run the focused Activity selector suite and the general Maestro selector suite with natural exits.
- [x] 3.2 Parse the Activity flow with the pinned Maestro CLI and run applicable TypeScript, lint, formatting, and diff checks.
- [x] 3.3 Run strict OpenSpec validation and confirm the completed proposal, design, delta spec, and checked task record are present in the dated archive.
- [x] 3.4 Inspect the branch diff for scope and disclosure hygiene, push the same PR branch, and require exact-head iOS native E2E before review acceptance.
