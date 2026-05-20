## Why

Phase 2 ([TIM-3](/TIM/issues/TIM-3)) is the dependency-upgrade & maintenance
phase. Audit slice B5 ([TIM-47](/TIM/issues/TIM-47)) targets the
`hooks_riverpod` major bump 2.6.1 → 3.x. The pre-flight check on
2026-05-20 confirmed that `hooks_riverpod` is a real, load-bearing
dependency — 72 files under `app/lib/` import it and the entire app state
graph (calendar events, user calendars, personal events, hidden events,
checklists, school selection, activity logs, settings, splash flow) runs
through Riverpod providers.

Riverpod 3 removes the legacy `StateNotifier` API in favour of the
`Notifier` / `AsyncNotifier` API that the codebase has already adopted
for the recently-added providers (events, user calendars, personal
events, calendar logs). Five providers still use the legacy
`StateNotifier`/`StateNotifierProvider` shape and must be migrated as
part of the bump or the analyzer / build will fail. Riverpod 3 also
changes a small number of behavioural defaults (`autoDispose` becomes
the default lifetime, `AsyncNotifier` retry policy changes) that need
explicit handling at every provider call site, not just the legacy five.

## What Changes

- **BREAKING (Dart API):** Bump `hooks_riverpod` 2.6.1 → 3.3.1 in
  `app/pubspec.yaml`. The `state_notifier` package is transitive only
  (not declared in `pubspec.yaml`) and will fall out of the lockfile
  when the bump lands.
- **BREAKING (Dart API):** Replace every `StateNotifier` /
  `StateNotifierProvider` in `app/lib/` with the Riverpod 3
  `Notifier` / `NotifierProvider` (synchronous state) or
  `AsyncNotifier` / `AsyncNotifierProvider` (async state) API.
  Five files migrate (verified 2026-05-20):
  - `app/lib/modules/assistant/providers/assistant_provider.dart` —
    sync state → `Notifier<AssistantState>`.
  - `app/lib/modules/hidden_event/providers/hidden_event_provider.dart`
    — sync state → `Notifier<HiddenEvent>`.
  - `app/lib/modules/event_details/providers/event_nb_checklist_items_provider.dart`
    — sync state → `Notifier<Map<String, ChecklistItemEventCount>>`.
  - `app/lib/modules/event_details/providers/checklist_item_provider.dart`
    — sync state with `.autoDispose.family<…, String>` → `Notifier`
    with the Riverpod 3 family pattern; lifetime stays autoDispose (it
    is the default in v3, so the modifier is dropped).
  - `app/lib/modules/school/controllers/school_selection_controller.dart`
    — async state (`AsyncValue<BuiltList<SchoolForList>>`) →
    `AsyncNotifier<BuiltList<SchoolForList>>` with `build()` performing
    the initial `findSchools()` fetch.
- **Audit and align every other Riverpod provider** in the 72-file
  surface for Riverpod 3 behavioural defaults:
  - **Lifetime: `autoDispose` is the default in v3.** Long-lived
    top-level providers that previously relied on the default `keepAlive`
    (no `.autoDispose` modifier) must explicitly call
    `ref.keepAlive()` inside `build()` so their state survives the last
    listener unmounting. Affected (verified 2026-05-20): `eventsProvider`,
    `eventsForViewProvider`, `userCalendarProvider`,
    `personalEventsProvider`, `calendarLogsProvider`, `hiddenEventProvider`,
    `eventNbChecklistItemsProvider`, `assistantProvider`,
    `calendarEventsProvider`, `appIsLoadedProvider`, `icalUrlProvider`,
    `addGradeNameProvider`, `addSchoolNameProvider`,
    `homeScreenDataProvider`, `dayDisplayedOnHomePageProvider`,
    `homeEventsProvider`, `eventsForPlanningViewProvider`. Providers
    that already declare `.autoDispose` keep autoDispose semantics
    (`checklistItemProvider`, `schoolSearchProvider`,
    `schoolFilteredProvider`, `debugCalendarDetailsProvider`).
  - **AsyncNotifier retry policy.** Riverpod 3 ships a default
    exponential-backoff retry on `AsyncNotifier`. The codebase's
    AsyncNotifier providers (`eventsProvider`, `eventsForViewProvider`,
    `userCalendarProvider`, `personalEventsProvider`,
    `calendarLogsProvider`, and the migrated
    `schoolSelectionControllerProvider`) SHALL explicitly override
    `retry` to `null` (no retry) so failed loads surface to the UI on
    the first attempt, matching the v2.6 behaviour the screens currently
    expect.
  - **`ref.listen` / `ref.watch` signature tightening.** Riverpod 3
    requires the `ref.listen` callback to be `(previous, next)` with
    both nullable. The single call site
    (`school_selection_screen.dart` line 31, listening on
    `AsyncValue<BuiltList<SchoolForList>>`) is updated to the v3
    signature.
- **Update every `ref.read(<provider>.notifier).<method>()`** call
  site that targets a migrated provider, since the notifier class
  changes constructor shape (no longer takes `Ref` in the constructor —
  `ref` is an instance member of `Notifier`/`AsyncNotifier`).
- **Update the one existing test** that touches `StateNotifier` shape
  (`app/test/modules/school/controllers/school_selection_controller_test.dart`
  uses `controller.addListener` and a `_SeededSchoolController` subclass)
  to the Riverpod 3 `AsyncNotifier` test pattern. No new tests are added
  in this change — regression coverage is the existing unit suite plus
  the Phase 1 E2E smoke flows.

## Capabilities

### New Capabilities
- `riverpod-state-management`: records that the app's state-management
  layer is on the Riverpod 3 `Notifier` / `AsyncNotifier` API with no
  surviving `StateNotifier` usage, plus the project-wide handling rules
  for the two v3 default changes (autoDispose, AsyncNotifier retry).

### Modified Capabilities
<!-- None. The `flutter-dependency-baseline` spec is a B2 minor-bump
     baseline (built_value, dio, freezed, etc.) and does not enumerate
     `hooks_riverpod`; this change introduces the Riverpod-specific
     capability `riverpod-state-management` rather than amending B2.
     `flutter-dependency-hygiene` (B3) is about dead-dep removal and is
     unrelated. -->

## Impact

- `app/pubspec.yaml` — one bump: `hooks_riverpod: ^2.6.1` →
  `hooks_riverpod: ^3.3.1`.
- `app/pubspec.lock` — regenerated by `flutter pub get`. The transitive
  `state_notifier` entry falls out.
- `app/lib/` Dart sources — five `StateNotifier` files rewritten as
  `Notifier` / `AsyncNotifier` (see list above); every other Riverpod
  provider audited for the autoDispose default and (where applicable)
  the AsyncNotifier retry override; `ref.listen` signature aligned at
  the one call site that uses it; `ref.read(<provider>.notifier)` call
  sites for the migrated providers updated for the new notifier shape.
- `app/test/modules/school/controllers/school_selection_controller_test.dart`
  — rewritten to the `AsyncNotifier` test pattern (no `addListener`,
  no `StateNotifier` subclass).
- No edits to `server/`, `openapi/`, `web/`, native platform
  configuration, or CI workflows. The `provider:` package
  (different package, different API) is OUT of scope and stays at its
  current usage — its consolidation is deferred to
  [TIM-50](/TIM/issues/TIM-50) / Phase 3.
- Behaviour: the app's runtime behaviour SHALL be unchanged. The
  explicit `ref.keepAlive()` calls preserve every state's existing
  lifetime; the `retry: null` overrides preserve the existing
  no-retry-on-failure UX. `flutter analyze`, `flutter test`, and the
  Phase 1 E2E smoke suite are the regression gate.
