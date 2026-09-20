## Why

Calendar import currently gives students no meaningful progress or completion feedback, can leave the calendar view empty until a later app restart or refresh, and exits through the nearest nested Stack instead of deterministically removing onboarding. The export-guide provider screen also exposes an internal route name while loading and uses a title too long for native mobile chrome.

## What Changes

- Give export-guide provider loading, error, and loaded states one short, stable localized native title, with the longer selection prompt in page content.
- Replace the QR camera and iCal form with an accessible progress surface while a valid import is running.
- Preserve import checkpoints so an in-session retry resumes token resolution, local persistence, or event hydration instead of blindly creating the server calendar again.
- Move a durably persisted import to a root-level result screen that removes the onboarding Stack and owns event loading, recoverable sync failure, and a deliberate success state.
- Show success only after synced events have been transactionally written to local SQLite, then provide a button that pops to the existing Calendar tab without creating another tab or onboarding entry.
- Make QR recovery bounded: scanning another code resets the current route, while switching to iCal replaces the QR sibling so native Back returns to the import-method chooser.
- Coordinate calendar-sync invocations so import can require a fresh token snapshot after any older in-flight startup/foreground sync and stale responses cannot erase newly imported events.
- Keep future notification enablement possible on the result screen, without adding notification controls in this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-export-guide-journey`: Require stable short native chrome across provider loading, error, and content states.
- `mobile-qr-scan`: Replace the invisible import/completion phases with accessible progress and bounded recovery navigation, then hand durable imports to the shared result flow.
- `mobile-ical-import`: Extend pending and failure behavior across the complete create/persist operation and hand durable imports to the shared result flow.
- `mobile-import-journey`: Define the root-level import result, onboarding teardown, success CTA, Back behavior, and non-growing QR/iCal navigation history.
- `mobile-calendar-identity-persistence`: Make retries checkpoint-aware after the server returns a token and establish durable calendar persistence as the boundary before result navigation.
- `mobile-calendar-sync`: Add coordinated, observable sync outcomes and require a fresh post-import pass whose event commit gates success.

## Impact

- Mobile routing gains one root-level, headerless import-result route and removes the successful-import use of `dismissAll()`.
- Calendar-source controllers, shared add-calendar persistence, and calendar-sync orchestration gain explicit staged outcomes and concurrency coverage.
- The local `user_calendars` and `calendar_events` schemas remain unchanged; the server API and generated client remain unchanged.
- French and English catalogs, route-structure tests, component/controller tests, sync concurrency tests, architecture documentation, and the mobile manual/on-device verification handoff are affected.
- No dependency, native permission, OpenAPI, backend schema, or notification-registration change is required.
