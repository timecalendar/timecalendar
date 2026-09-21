## Why

Notification preferences still use a universal menu picker and a custom stepper, so they do not match the native settings journeys now established by the rest of the app. Students also need to keep every existing 1–30 day value while choosing common horizons quickly, entering uncommon values safely, and retaining the shared save status delivered by the notification synchronization runtime.

## What Changes

- Recompose the notification page with the project-owned native settings host, sections, rows, switch, and translated explanatory copy while preserving immediate local preferences and shared pending/error/retry state.
- Replace the frequency picker with an iOS pushed checkmarked list and an Android single-choice radio dialog for Immediately, Hourly, and Daily.
- Replace the days-ahead stepper with a native choice flow for 1, 3, 7, 14, 30, and Custom; preset-equivalent saved values select their preset, while other valid values remain Custom and display their effective day count.
- Add a Router-owned iOS form sheet and an Android native numeric dialog for Custom. Both keep an uncommitted draft, validate an exact whole number from 1 through 30, discard on cancellation/dismissal, and persist exactly once only after Done/Save.
- Keep frequency and horizon values while notifications are off, and clarify in French and English that the switch expresses subscription intent, daily processing is at 19:00 Paris time, immediate processing runs every five minutes, and the horizon covers calendar changes rather than reminder timing.
- Reconcile notification specifications, native settings/navigation/testing guidance, catalogs, mocks, route inventory, and focused CI-discovered tests with the resulting behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-fcm-subscription`: replace the generic bounded controls with platform-native frequency and horizon choice journeys, exact custom-draft validation/commit semantics, truthful schedule copy, retained disabled-state preferences, and route-independent shared synchronization status.
- `mobile-architecture-book`: record the reusable native notification selection, numeric-editor, route ownership, localization, accessibility, and automated-versus-device proof contracts.

## Impact

- Primary code: `mobile/src/features/notifications/ui/`, notification preference hooks/types, thin notification selection/custom routes under `mobile/src/app/`, and root Stack registration.
- Shared chrome: `mobile/src/components/chrome/` native settings composition and numeric-entry boundaries, with matching Expo UI mocks and contract tests.
- Localization and proof: `mobile/src/i18n/locales/{en,fr}.json`, notification UI/data tests, route-structure tests, Architecture Book guidance/changelog, and OpenSpec deltas.
- The existing notification preference keys, 1–30 range, generated DTO, OpenAPI contract, synchronization runtime, server queue schedules, notification permission behavior, and server code remain unchanged.
- Sensitive surfaces touched: none expected. In particular, `openapi/openapi.json`, `mobile/src/api/generated/`, native/store/EAS/Firebase configuration, migrations, deploy/CI workflows, and the legacy Flutter app remain out of scope. Owner-led device acceptance remains release evidence rather than an automated or separate QA gate.
