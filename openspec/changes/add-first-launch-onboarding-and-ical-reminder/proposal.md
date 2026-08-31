# First-launch onboarding and first-iCal reminder

## Why

The React Native app currently paints the tabs on a fresh install and leaves onboarding as an optional destination, so a new user can miss the calendar setup journey entirely. First launch needs a migration-safe onboarding decision without locking out people who want TimeCalendar only for personal events, and those users need a separate reminder that importing an iCal remains available later.

## What Changes

- Gate the initial route behind committed startup prerequisites and the durable calendar-source read: an unresolved fresh install with no user calendars enters onboarding before Home or Calendar can paint, while an imported or previously skipped user enters the tabs.
- Add a deliberate Skip action to onboarding. It uses a shared accessible confirmation dialog, persists an explicit onboarding-skipped resolution, and lands on the tabs without disabling personal-event creation.
- Resolve onboarding through the shared import-success exit when the first calendar is imported. Deleting all calendars later never reopens onboarding.
- Add an independently persisted first-iCal-reminder dismissal. Skipping onboarding does not dismiss it.
- Show one shared, prominent, bottom-safe-area import reminder on Home and Calendar whenever there are zero durable user calendars and the reminder is not dismissed. Its CTA reuses the existing add/import journey; dismissal reuses the same confirmation dialog and copy as onboarding Skip.
- Make migration completion an explicit prerequisite of app readiness and leave a typed prerequisite slot for the future Phase 09 Flutter importer. A migration or future importer failure remains startup-blocking; the splash watchdog may surface recovery UI but must never reveal an ineligible route.
- Localize all visible and accessibility copy in French and English; cover Dynamic Type, screen-reader focus/semantics, reduced motion, safe areas, small screens, and platform touch targets.
- Replace the fresh-install Maestro path with a no-deep-link flow that enters onboarding, skips, creates a personal event with zero calendars, and observes the reminder on both tabs while preserving imported-calendar/onboarding-success coverage.

## Capabilities

### New Capabilities

- `mobile-first-launch-gate`: startup prerequisite coordination, durable onboarding resolution, the route-decision matrix, skip confirmation, and import-success resolution.
- `mobile-first-ical-reminder`: independent reminder dismissal and the shared Home/Calendar import-reminder presentation, confirmation, and routing behavior.

### Modified Capabilities

- `mobile-onboarding-flow`: Skip now confirms and resolves onboarding instead of navigating to school selection, and unresolved fresh installs are gated into the existing welcome-first stack.
- `mobile-splash`: readiness must await committed migrations, future importer readiness, calendar-source eligibility, and a safe initial route; a watchdog cannot bypass route eligibility.
- `mobile-import-journey`: successful onboarding import records onboarding resolution and exits deterministically to the tabs through the shared success seam.
- `mobile-storage`: committed migrations become an awaited startup prerequisite, and the two independent typed flags are stored behind feature-owned `@/storage` seams with reviewed reset classification.
- `mobile-e2e`: the fresh-install device flow starts without a deep link and proves skip, zero-calendar personal-event use, and the reminder on Home and Calendar.

## Impact

- `mobile/src/app/_layout.tsx`, `mobile/src/hooks/use-app-ready.ts`, and splash/root-navigation tests: replace the split fire-and-forget readiness posture with one prerequisite/eligibility gate that cannot flash tabs.
- `mobile/src/features/onboarding/`: typed resolution store, startup decision logic, shared confirmation UI/copy, and welcome-screen Skip wiring.
- `mobile/src/features/calendar-sources/`: consume the existing public user-calendar hooks and extend the shared successful-import exit seam; no UI imports `@/db`.
- `mobile/src/features/home/` and `mobile/src/features/calendar/`: render the shared bottom-safe-area reminder without duplicating import behavior.
- `mobile/src/storage/`, `mobile/src/i18n/locales/{en,fr}.json`, focused Jest suites, and `mobile/.maestro/` fresh-install/onboarding flows.
- `docs/mobile/architecture-book/navigation.md`, `storage.md`, `CHANGELOG.md`, a new startup-routing ADR, and `docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md`.
- No OpenAPI/generated-client, server migration, native/store/EAS configuration, deploy/CI, secret, or legacy Flutter change. Phase 09 importer implementation and server/API work remain out of scope.
