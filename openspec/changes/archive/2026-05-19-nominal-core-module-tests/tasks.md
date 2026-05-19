# Tasks

Conventions for every task below:
- Test files mirror `lib/`: a test for `lib/modules/<m>/<p>/<f>.dart` lives at
  `test/modules/<m>/<p>/<f>_test.dart` (run from `app/`).
- Follow `app/test/README.md` and the exemplars
  (`test/modules/shared/utils/color_utils_test.dart` for pure unit tests,
  `test/modules/shared/widgets/ui/custom_button_test.dart` for widget tests).
- Mock with `mocktail`; register fallback values in `setUpAll`.
- Flutter SDK is not on `PATH`: `export PATH="/home/dev/flutter/bin:$PATH"`,
  run from `app/`.
- Each task is independently verifiable: `flutter test <file>` must pass and
  `flutter analyze <file>` must report no new issues.
- Tests are **nominal / happy-path only** — no error or edge-case exhaustion.

## 1. Shared test fixtures

- [x] 1.1 Create `app/test/support/fixtures.dart` with a `buildCalendarEvent({...})`
  builder returning a `CalendarEvent` (implements `EventInterface`) with sane
  defaults for every required field, each overridable — at minimum `uid`,
  `title`, `startsAt`, `endsAt`, `color`, `groupColor`. Used by tasks 2–3.
- [x] 1.2 In the same file add `buildSchoolForList({...})` (built_value
  `SchoolForListBuilder`, including the required nested `SchoolAssistant`) and
  `buildFindSchoolsRep(List<SchoolForList>)` returning a `FindSchoolsRepDto`.
  Used by task 6.

## 2. calendar — pure helpers

- [x] 2.1 `test/modules/calendar/helpers/events_helper_test.dart` —
  `eventsOverlap` true for overlapping events, false for disjoint events;
  `eventStartsAtHour` / `eventEndsAtHour` return the expected fractional hour
  (e.g. 09:30 → 9.5).
- [x] 2.2 `test/modules/calendar/helpers/events_for_week_view_helper_test.dart` —
  `getEventsForWeekView` returns a list of 7 day-buckets; an event is placed in
  the bucket for its start day; an event outside the requested week is excluded.
  Anchor fixtures to `AppDateUtils.dayAtWeekNumber(weekNumber)`.
- [x] 2.3 `test/modules/calendar/helpers/events_for_planning_view_helper_test.dart` —
  `getEventsForPlanningView` returns `[]` for empty input; groups events into
  per-day `EventsByDay` entries; input is sorted by `startsAt`.

## 3. calendar — event layout model

- [x] 3.1 `test/modules/calendar/models/ui/event_for_ui_test.dart` —
  `EventForUI.listFromEvents`: non-overlapping events each get `columns == 1`,
  `startColumn == 0`, `endColumn == 1`; two overlapping events get distinct
  columns and `columns == 2`; the result is ordered by `event.startsAt`.

## 4. calendar — model serialization

- [x] 4.1 `test/modules/calendar/models/calendar_event_test.dart` —
  `CalendarEvent.fromInternalDb(map)` then `.toDbMap()` round-trips the core
  fields (uid, title, colors, dates, location, tags, fields).
- [x] 4.2 `test/modules/calendar/models/event_tag_test.dart` —
  `EventTag.fromDb` → `toDbMap` round-trip preserves `name`/`color`/`icon`;
  `iconData` is populated (a non-null `IconData`) from the `icon` string.
- [x] 4.3 `test/modules/calendar/models/calendar_event_custom_fields_test.dart` —
  `CalendarEventCustomFields.fromInternalDb` → `toDbMap` round-trips
  `canceled`, `shortDescription`, `subject`, `groupColor`.

## 5. event_details

- [x] 5.1 `test/modules/event_details/models/checklist_item_test.dart` —
  `ChecklistItem.fromMap` → `toMap` round-trip; the constructor auto-generates a
  `uuid` when none is passed; ISO date strings parse and serialize correctly.
- [x] 5.2 `test/modules/event_details/controllers/checklist_focus_controller_test.dart` —
  listeners passed to the constructor are invoked by `focusItem`;
  `addListener` registers a new listener; `removeListener` stops notifications.
- [x] 5.3 `test/modules/event_details/widgets/event_details_checklist_item_test.dart`
  (widget test via `pumpApp`) — renders the item content in the `TextField`;
  the `Checkbox` reflects `checklistItem.isChecked`; tapping the checkbox calls
  `onCheckChanged` and tapping the close icon calls `removeItem`. Provide a
  `ChecklistItem` with non-null `content` (the widget reads `content!`).

## 6. school

- [x] 6.1 `test/modules/school/controllers/school_selection_controller_test.dart` —
  construct `SchoolSelectionController` with a `mocktail`-mocked `ApiClient`
  whose `schoolsApi().findSchools()` resolves to a `Response<FindSchoolsRepDto>`
  (built via task 1.2); assert `fetch()` sets state to `AsyncData` with the
  schools. Also test `schoolFilteredProvider` in a `ProviderContainer`:
  override `schoolSelectionControllerProvider` with seeded data, set
  `schoolSearchProvider`, and assert filtering matches by school `name` and by
  `code`.

## 7. settings

- [x] 7.1 `test/modules/settings/providers/settings_provider_test.dart` — in
  `setUp` call `TestWidgetsFlutterBinding.ensureInitialized()`,
  `SharedPreferences.setMockInitialValues({})` and
  `PackageInfo.setMockInitialValues(...)`. Assert `loadSettings(prefs)`
  populates the documented defaults (e.g. `dateLimit == 14`,
  `calendarHourHeight == 60`, `calendarViewType == CalendarViewType.Week`);
  `getEventColorToSave(null)` / `getEventColorToDisplay(null)` return `null`;
  `getEventInterfaceColor` returns `event.color` when `colorsByGroup` is false
  and `event.groupColor` when true.

## 8. onboarding (widget — lowest priority, droppable)

- [x] 8.1 `test/modules/onboarding/screens/onboarding_screen_test.dart`
  (widget test) — wrap `OnboardingScreen` in a
  `ChangeNotifierProvider<SettingsProvider>.value` whose `SettingsProvider` has
  had `loadSettings` run against `SharedPreferences.setMockInitialValues` (so
  the `initState` `currentVersion` setter does not throw). Assert the first
  page text renders, the "Passer" and "Suivant" controls are present, and
  tapping "Suivant" advances the `PageView` to the second page.
  If the `initState` plugin coupling makes this disproportionately costly,
  document why and skip it — the change is complete without 8.1.

## 9. Verification

- [x] 9.1 Run `flutter test` from `app/` — the whole suite is green
  (existing A1 tests plus all new tests).
- [x] 9.2 Run `flutter analyze` from `app/` — no new issues introduced by the
  added test files (and `test/support/fixtures.dart`).
