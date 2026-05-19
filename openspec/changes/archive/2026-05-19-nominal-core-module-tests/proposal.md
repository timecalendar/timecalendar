## Why

The `flutter-test-foundation` change (TIM-4 / A1) gave the app a test harness, a
mocking strategy and two exemplar tests — but no real coverage. Today a
regression in core calendar logic, event-detail serialization or settings
defaults ships silently: nothing fails. This change (TIM-6 / A3) adds
*nominal, happy-path* tests to the highest-value modules so regressions in the
logic the app depends on every launch surface in `flutter test`.

This is **not** a coverage-percentage exercise. The target is regression
safety per line of test code: pure logic (helpers, models, controllers,
providers) first, a few widget tests for interactive components second.

## What Changes

Add unit and widget tests under `app/test/`, mirroring `app/lib/modules/`,
following the patterns in `app/test/README.md` and the two exemplar tests.
No production (`lib/`) code changes.

- **Test fixtures** — a shared `test/support/fixtures.dart` with builders
  (`buildCalendarEvent`, `buildSchoolForList`, …) so tests construct domain
  objects without repeating long required-argument lists.
- **calendar (highest value — pure algorithmic logic):**
  - `helpers/events_helper.dart` — overlap detection and fractional-hour math.
  - `helpers/events_for_week_view_helper.dart` — week bucketing.
  - `helpers/events_for_planning_view_helper.dart` — per-day grouping.
  - `models/ui/event_for_ui.dart` — the column-layout algorithm for
    overlapping events (the most intricate logic in the app).
  - `models/calendar_event.dart`, `models/event_tag.dart`,
    `models/calendar_event_custom_fields.dart` — DB serialization round-trips.
- **event_details:**
  - `models/checklist_item.dart` — map round-trip + uuid auto-generation.
  - `controllers/checklist_focus_controller.dart` — listener register/notify/remove.
  - `widgets/event_details_checklist_item.dart` — a widget test for the one
    checklist widget with real interaction logic (checkbox, edit, remove).
- **school:**
  - `controllers/school_selection_controller.dart` — `fetch()` happy path and
    the `schoolFilteredProvider` name/code filter.
- **settings:**
  - `providers/settings_provider.dart` — `loadSettings` defaults and the pure
    color/theme helper methods.
- **onboarding:**
  - `screens/onboarding_screen.dart` — a widget test: first page renders,
    skip/next controls present, "Suivant" advances the carousel.

Non-goals: 100% coverage, error/edge-case exhaustion, E2E/integration tests
(A2 — TIM-5), production code changes or refactors, and CI changes (the
`test-app` job from A1 already runs the whole `app/test/` tree).

## Capabilities

### New Capabilities
- `core-module-test-coverage`: nominal regression tests for the core Flutter
  modules — one requirement per module (calendar, event_details, school,
  settings, onboarding) describing the logic that `flutter test` now guards.

### Modified Capabilities
<!-- None — `flutter-test-harness` is unchanged; this change consumes it. -->

## Impact

- `app/test/support/fixtures.dart` — new shared test-fixture builders.
- `app/test/modules/calendar/**` — new test files for helpers and models.
- `app/test/modules/event_details/**` — new test files for model, controller, widget.
- `app/test/modules/school/**` — new test file for the selection controller/provider.
- `app/test/modules/settings/**` — new test file for the settings provider.
- `app/test/modules/onboarding/**` — new widget test file.
- No `lib/` changes; app behaviour is unchanged. No `pubspec.yaml` or CI changes.
