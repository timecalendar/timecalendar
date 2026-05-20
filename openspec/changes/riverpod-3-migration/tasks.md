# Tasks

Conventions:
- All paths are relative to the repository root.
- Run Flutter commands from `app/`. Use the project's Flutter SDK
  (`/home/dev/flutter/bin/flutter`); Flutter is not on PATH (see
  `[[flutter-sdk-location]]` memory).
- The branch `TIM-99-riverpod-3-migration` is already created by the
  Planner. The Applier ([TIM-100](/TIM/issues/TIM-100)) continues on
  that branch.
- The 7 task groups below map 1:1 to the 7 logical commits in
  `design.md` Decision D6. Land them in order — do not interleave.
- After every group, run `flutter analyze` from `app/` and confirm
  zero errors before moving on. A clean tree per commit makes the
  Reviewer's job tractable.

## 1. Pubspec bump and lockfile refresh

- [ ] 1.1 In `app/pubspec.yaml`, bump `hooks_riverpod: ^2.6.1` to
  `hooks_riverpod: ^3.3.1`.
- [ ] 1.2 From `app/`, run `flutter pub get` to refresh
  `app/pubspec.lock`.
- [ ] 1.3 Confirm `app/pubspec.lock` resolves `hooks_riverpod` to a
  `3.x` version (e.g., `3.3.1` or higher within the 3.x line).
- [ ] 1.4 Confirm `app/pubspec.lock` no longer contains a
  `state_notifier:` entry (`grep -n 'state_notifier:' app/pubspec.lock`
  is clean).
- [ ] 1.5 Run `flutter analyze` from `app/` and **expect failures** —
  this is the baseline of v3 breakages that the next groups will fix.
  Record the error count in implementation notes so the Reviewer has a
  before/after.
- [ ] 1.6 Commit: `chore(app): bump hooks_riverpod 2.6.1 → 3.3.1 (TIM-47 / B5)`.

## 2. Migrate the five `StateNotifier` files

For each of the five providers below, replace
`extends StateNotifier<T>` with `extends Notifier<T>` (sync) or
`extends AsyncNotifier<T>` (async) and rewire the corresponding
`StateNotifierProvider<…>` into `NotifierProvider<…>` /
`AsyncNotifierProvider<…>`. The `Ref` parameter is removed from the
constructor; `ref` becomes an instance member (already provided by
`Notifier`/`AsyncNotifier`). Initial state is set by the `build()`
method's return value, not by `super(initialState)`.

### 2a. Assistant provider

- [ ] 2.1 In `app/lib/modules/assistant/providers/assistant_provider.dart`:
  - Change `class AssistantNotifier extends StateNotifier<AssistantState>`
    to `class AssistantNotifier extends Notifier<AssistantState>`.
  - Remove the `AssistantNotifier() : super(AssistantState());` constructor.
  - Add `@override AssistantState build() => AssistantState();`.
  - Inside `build()`, add `ref.keepAlive();` (Task Group 3 policy applied here at migration time, to keep the diff for this file small).
  - Change `final assistantProvider = StateNotifierProvider<AssistantNotifier, AssistantState>((ref) => AssistantNotifier());`
    to `final assistantProvider = NotifierProvider<AssistantNotifier, AssistantState>(AssistantNotifier.new);`.
- [ ] 2.2 Verify the two call sites compile against the new shape:
  `app/lib/modules/school/screens/school_selection/school_selection_screen.dart`
  (`ref.read(assistantProvider.notifier)`) and any other
  `ref.read(assistantProvider*)` matches found by
  `grep -rn 'assistantProvider' app/lib --include='*.dart'`.

### 2b. Hidden-event provider

- [ ] 2.3 In `app/lib/modules/hidden_event/providers/hidden_event_provider.dart`:
  - Change `class HiddenEventNotifier extends StateNotifier<HiddenEvent>`
    to `class HiddenEventNotifier extends Notifier<HiddenEvent>`.
  - Remove the `Ref ref;` field and the
    `HiddenEventNotifier(this.ref) : super(new HiddenEvent());` constructor.
    `ref` is inherited from `Notifier`.
  - Add `@override HiddenEvent build() { ref.keepAlive(); return HiddenEvent(); }`.
  - Change `final hiddenEventProvider = StateNotifierProvider<HiddenEventNotifier, HiddenEvent>((ref) => HiddenEventNotifier(ref));`
    to `final hiddenEventProvider = NotifierProvider<HiddenEventNotifier, HiddenEvent>(HiddenEventNotifier.new);`.
- [ ] 2.4 Verify call sites:
  `app/lib/modules/splash/hooks/use_splash_controller.dart`
  (`ref.read(hiddenEventProvider.notifier).loadFromDatabase()`),
  `app/lib/modules/event_details/widgets/event_details_hidden_dialog.dart`
  (`addUidEvent`, `addNamedEvent`),
  `app/lib/modules/calendar/providers/events_provider.dart`
  (`ref.watch(hiddenEventProvider)` inside `EventsForViewNotifier.build`).

### 2c. Event-checklist-count provider

- [ ] 2.5 In `app/lib/modules/event_details/providers/event_nb_checklist_items_provider.dart`:
  - Change `class EventNbChecklistItemsNotifier extends StateNotifier<Map<String, ChecklistItemEventCount>>`
    to `class EventNbChecklistItemsNotifier extends Notifier<Map<String, ChecklistItemEventCount>>`.
  - Remove the `Ref ref;` field and the
    `EventNbChecklistItemsNotifier(this.ref) : super({});` constructor.
  - Add `@override Map<String, ChecklistItemEventCount> build() { ref.keepAlive(); return {}; }`.
  - Rewire the provider:
    `final eventNbChecklistItemsProvider = NotifierProvider<EventNbChecklistItemsNotifier, Map<String, ChecklistItemEventCount>>(EventNbChecklistItemsNotifier.new);`.
- [ ] 2.6 Verify call sites:
  `app/lib/modules/event_details/providers/checklist_item_provider.dart`
  (three `ref.read(eventNbChecklistItemsProvider.notifier).update()`),
  `app/lib/modules/splash/hooks/use_splash_controller.dart`
  (`ref.read(eventNbChecklistItemsProvider.notifier).update()`),
  and the derived `getEventNbChecklistItemsProvider` in the same file
  (`ref.watch(eventNbChecklistItemsProvider)`).

### 2d. Checklist-item provider (family + autoDispose)

- [ ] 2.7 In `app/lib/modules/event_details/providers/checklist_item_provider.dart`:
  - Change `class ChecklistItemNotifier extends StateNotifier<List<ChecklistItem>>`
    to `class ChecklistItemNotifier extends FamilyNotifier<List<ChecklistItem>, String>`.
  - Remove the `Ref ref;` field and the
    `ChecklistItemNotifier(this.ref, this.eventUid) : super([]) { loadEventItems(); }` constructor.
    Keep `String eventUid;` as a field that is populated from the
    family `arg` inside `build()` (e.g., `eventUid = arg;`).
  - Add
    `@override List<ChecklistItem> build(String eventUid) { this.eventUid = eventUid; _loadEventItems(); return []; }`.
    The initial state stays empty; `_loadEventItems()` mutates `state`
    asynchronously when the repository resolves (matching v2 behaviour).
  - Rewire the provider:
    `final checklistItemProvider = NotifierProvider.family<ChecklistItemNotifier, List<ChecklistItem>, String>(ChecklistItemNotifier.new);`.
    The `.autoDispose` modifier is dropped — autoDispose is the v3
    default and this provider explicitly opted into it under v2.
- [ ] 2.8 Verify the one call site:
  `app/lib/modules/event_details/widgets/event_details_checklist_section.dart`
  (`ref.read(checklistItemProvider(event.uid).notifier).addItem()`).
- [ ] 2.9 Replace the `loadEventItems()` public method with a private
  `_loadEventItems()` (it is only called from `build()` now).

### 2e. School-selection controller (async)

- [ ] 2.10 In `app/lib/modules/school/controllers/school_selection_controller.dart`:
  - Change
    `class SchoolSelectionController extends StateNotifier<AsyncValue<BuiltList<SchoolForList>>>`
    to
    `class SchoolSelectionController extends AsyncNotifier<BuiltList<SchoolForList>>`.
    The `state` field now exposes `AsyncValue<BuiltList<SchoolForList>>`
    automatically through the `AsyncNotifier` base class.
  - Remove the `ApiClient client;` field and the constructor that
    receives it. Read the client inside `build()` via
    `final client = ref.read(apiClientProvider);`.
  - Add
    `@override Future<BuiltList<SchoolForList>> build() async { ref.keepAlive(); final client = ref.read(apiClientProvider); final rep = await client.schoolsApi().findSchools(); return rep.data!.schools; }`.
  - Keep `Future<BuiltList<SchoolForList>> fetch()` as a public method
    for explicit re-fetch from the retry button: it calls
    `state = const AsyncValue.loading();` then
    `state = await AsyncValue.guard(() => _doFetch());` where
    `_doFetch` is the same body as `build()` minus the keepAlive.
    Remove the `if (mounted)` guard — `AsyncNotifier` handles disposal
    via `ref.onDispose` if needed; the current usage does not require
    a mount check.
  - Add a `retry` override
    (`@override Retry? get retry => null;`) on the class — Task Group
    4 will sweep the others, but include it here so the file is
    correct in this commit.
  - Rewire the provider:
    `final schoolSelectionControllerProvider = AsyncNotifierProvider<SchoolSelectionController, BuiltList<SchoolForList>>(SchoolSelectionController.new);`.
  - Leave `schoolSearchProvider` (already `StateProvider.autoDispose`)
    and `schoolFilteredProvider` (already `Provider.autoDispose`)
    untouched in this task — Task Group 3 confirms they need no
    keepAlive (they were already autoDispose).
- [ ] 2.11 Verify the call sites:
  `app/lib/modules/school/screens/school_selection/school_selection_screen.dart`
  (`ref.listen<AsyncValue<BuiltList<SchoolForList>>>(schoolSelectionControllerProvider, …)`,
  `ref.read(schoolSelectionControllerProvider.notifier).fetch()`),
  and the derived `schoolFilteredProvider`
  (`ref.watch(schoolSelectionControllerProvider)` — the watched value
  is still `AsyncValue<BuiltList<SchoolForList>>`, the type matches).

### 2f. Confirm no `StateNotifier` is left

- [ ] 2.12 Run `grep -rn 'StateNotifier' app/lib app/test --include='*.dart'`
  and confirm zero matches.
- [ ] 2.13 Run `flutter analyze` from `app/`. The five-file migration
  should resolve every "StateNotifier is deprecated / removed" error.
  Other v3 errors (autoDispose default, retry, ref.listen signature)
  remain — they are addressed in groups 3-5.
- [ ] 2.14 Commit: `refactor(app): migrate 5 StateNotifier providers to Notifier/AsyncNotifier (TIM-47 / B5)`.

## 3. Add `ref.keepAlive()` to long-lived providers

Riverpod 3 makes `autoDispose` the default. Every provider listed
below was implicitly `keepAlive` under v2 (no `.autoDispose`
modifier) and SHALL call `ref.keepAlive()` inside its build body to
preserve that lifetime. Providers already migrated in Group 2
(assistantProvider, hiddenEventProvider, eventNbChecklistItemsProvider)
had their `keepAlive` added there and are NOT in this group.

### 3a. AsyncNotifier providers

- [ ] 3.1 `app/lib/modules/calendar/providers/events_provider.dart`:
  add `ref.keepAlive();` as the first line of `EventsNotifier.build()`
  and `EventsForViewNotifier.build()`.
- [ ] 3.2 `app/lib/modules/calendar/providers/user_calendar_provider.dart`:
  add `ref.keepAlive();` as the first line of
  `UserCalendarsNotifier.build()`.
- [ ] 3.3 `app/lib/modules/personal_event/providers/personal_events_provider.dart`:
  add `ref.keepAlive();` as the first line of
  `PersonalEventsNotifier.build()`.
- [ ] 3.4 `app/lib/modules/activity/providers/activity_provider.dart`:
  add `ref.keepAlive();` as the first line of
  `CalendarLogsNotifier.build()`.

### 3b. Functional providers (Provider / StateProvider / FutureProvider)

For each provider below, wrap the factory body so the first line is
`ref.keepAlive();`. For `StateProvider`, the factory is the initial
value lambda — convert it to a block body (`(ref) { ref.keepAlive(); return <initialValue>; }`).

- [ ] 3.5 `app/lib/modules/calendar/providers/events_provider.dart`:
  `calendarEventsProvider` (`StateProvider<List<CalendarEvent>>`).
- [ ] 3.6 `app/lib/modules/import_ical/providers/ical_url_provider.dart`:
  `icalUrlProvider` (`StateProvider<String?>`).
- [ ] 3.7 `app/lib/modules/home/providers/app_is_loaded_provider.dart`:
  `appIsLoadedProvider` (`StateProvider<bool>`).
- [ ] 3.8 `app/lib/modules/add_grade/providers/add_grade_provider.dart`:
  `addGradeNameProvider` (`StateProvider<String>`).
- [ ] 3.9 `app/lib/modules/add_school/providers/add_school_provider.dart`:
  `addSchoolNameProvider` (`StateProvider<String>`).
- [ ] 3.10 `app/lib/modules/home/providers/home_screen_data_provider.dart`:
  `homeScreenDataProvider` (`FutureProvider<HomeScreenData>`).
- [ ] 3.11 `app/lib/modules/home/providers/home_events_provider.dart`:
  `dayDisplayedOnHomePageProvider` (`FutureProvider<DateTime?>`) and
  `homeEventsProvider` (`FutureProvider<List<EventInterface>>`).
- [ ] 3.12 `app/lib/modules/calendar/providers/events_for_planning_view_provider.dart`:
  `eventsForPlanningViewProvider` (`FutureProvider`).
- [ ] 3.13 `app/lib/modules/event_details/providers/event_nb_checklist_items_provider.dart`:
  `getEventNbChecklistItemsProvider` (`Provider`). Confirm it needs
  `keepAlive` — it derives from `eventNbChecklistItemsProvider` which
  is itself keepAlive, so its lifetime should follow. Add
  `ref.keepAlive()` for consistency and to make the policy explicit.

### 3c. Audit pass — find any provider this list missed

- [ ] 3.14 Run
  `grep -rn 'final.*Provider\b.*=.*Provider\(' app/lib --include='*.dart'`
  and cross-reference every match against Group 2 (migrated)
  + Group 3 list above + the explicit-autoDispose allowlist
  (`checklistItemProvider`, `schoolSearchProvider`,
  `schoolFilteredProvider`, `debugCalendarDetailsProvider`). For each
  unaccounted provider, decide and record in implementation notes:
  "added keepAlive" or "intentionally autoDispose" — no provider
  should be unaccounted for.
- [ ] 3.15 Commit: `refactor(app): preserve keepAlive lifetime under Riverpod 3 autoDispose default (TIM-47 / B5)`.

## 4. Add `Retry? get retry => null` to every AsyncNotifier

- [ ] 4.1 `app/lib/modules/calendar/providers/events_provider.dart` —
  add `@override Retry? get retry => null;` to `EventsNotifier` and
  `EventsForViewNotifier`.
- [ ] 4.2 `app/lib/modules/calendar/providers/user_calendar_provider.dart`
  — add `@override Retry? get retry => null;` to
  `UserCalendarsNotifier`.
- [ ] 4.3 `app/lib/modules/personal_event/providers/personal_events_provider.dart`
  — add `@override Retry? get retry => null;` to
  `PersonalEventsNotifier`.
- [ ] 4.4 `app/lib/modules/activity/providers/activity_provider.dart`
  — add `@override Retry? get retry => null;` to
  `CalendarLogsNotifier`.
- [ ] 4.5 Confirm `SchoolSelectionController` already has the override
  (added in Task 2.10). If missing, add it here.
- [ ] 4.6 Audit:
  `grep -rn 'extends AsyncNotifier' app/lib --include='*.dart'` —
  every match SHALL also have a `get retry` override in the same
  file. Record the cross-check result in implementation notes.
- [ ] 4.7 Commit: `refactor(app): preserve fail-fast UX on AsyncNotifiers under Riverpod 3 (TIM-47 / B5)`.

## 5. Update `ref.listen` signature

- [ ] 5.1 In `app/lib/modules/school/screens/school_selection/school_selection_screen.dart`,
  update the `ref.listen<AsyncValue<BuiltList<SchoolForList>>>(...)`
  callback at line ~31 to the v3 signature
  `(AsyncValue<BuiltList<SchoolForList>>? previous, AsyncValue<BuiltList<SchoolForList>> next) { ... }`.
  The `previous` argument is nullable in v3; `next` keeps the same
  type as the watched value.
- [ ] 5.2 Confirm there are no other `ref.listen` call sites:
  `grep -rn 'ref\.listen' app/lib --include='*.dart'` shows only the
  one updated above.
- [ ] 5.3 Commit: `refactor(app): align ref.listen with Riverpod 3 callback signature (TIM-47 / B5)`.

## 6. Rewrite the one StateNotifier-shaped unit test

- [ ] 6.1 In `app/test/modules/school/controllers/school_selection_controller_test.dart`,
  replace the `_SeededSchoolController extends SchoolSelectionController`
  subclass with the `AsyncNotifier`-shaped equivalent: a subclass
  whose `build()` returns the seeded `BuiltList<SchoolForList>`
  directly (no constructor `state = AsyncValue.data(...)` write).
- [ ] 6.2 Replace the
  `controller.addListener((state) => observedState = state)` pattern
  in the `fetch` test with a `ProviderContainer` that overrides
  `schoolSelectionControllerProvider` with a controller wired to the
  `MockApiClient`, then asserts on `container.read(provider.future)`
  resolving to the expected list and `container.read(provider)` being
  `AsyncData` with that list.
- [ ] 6.3 Confirm the two `schoolFilteredProvider` tests still pass —
  they already use a fresh `ProviderContainer` and an `override` on
  the controller provider, which is forward-compatible with the new
  shape after the `_SeededSchoolController` rewrite.
- [ ] 6.4 From `app/`, run
  `flutter test test/modules/school/controllers/school_selection_controller_test.dart`
  and confirm all three subtests pass.
- [ ] 6.5 From `app/`, run the full `flutter test` and confirm the
  whole suite stays green (target: 50 tests passing, matching the
  pre-migration baseline).
- [ ] 6.6 Commit: `test(app): rewrite school_selection_controller_test for Riverpod 3 AsyncNotifier (TIM-47 / B5)`.

## 7. Final verification and clean-up

- [ ] 7.1 From `app/`, run `flutter analyze`. Confirm the output is
  `No issues found!` or matches the pre-migration baseline (no new
  warnings introduced by the migration).
- [ ] 7.2 From `app/`, run `flutter test`. Confirm `All tests passed!`.
- [ ] 7.3 Confirm the spec-level audit gates from
  `specs/riverpod-state-management/spec.md`:
  - `grep -rn 'StateNotifier' app/lib app/test --include='*.dart'`
    returns nothing.
  - `grep -n 'state_notifier:' app/pubspec.lock` returns nothing.
  - Every `extends AsyncNotifier` file in `app/lib/` also declares a
    `get retry` override.
- [ ] 7.4 Confirm scope discipline — the diff is limited to:
  - `app/pubspec.yaml`, `app/pubspec.lock` (Task 1).
  - The 5 migrated provider files (Task Group 2).
  - The providers touched for keepAlive (Task Group 3).
  - The AsyncNotifier files touched for retry (Task Group 4).
  - `app/lib/modules/school/screens/school_selection/school_selection_screen.dart`
    (Task 5).
  - `app/test/modules/school/controllers/school_selection_controller_test.dart`
    (Task Group 6).
  - No edits under `server/`, `openapi/`, `web/`, `app/ios/`,
    `app/android/`, or `app/lib/app.dart` lines 61–62 (the
    `provider:` package call sites).
- [ ] 7.5 Drop any imports the migration left orphaned
  (e.g., `import 'package:state_notifier/state_notifier.dart';` if it
  ever appears, which it should not). Re-run `flutter analyze` after
  any import cleanup.
- [ ] 7.6 Commit: `chore(app): final clean-up after Riverpod 3 migration (TIM-47 / B5)` —
  only if anything in 7.5 actually changed a file. Otherwise skip
  the commit and proceed.
- [ ] 7.7 Push the branch and open a PR titled
  `B5 — Riverpod 2→3 migration + StateNotifier removal (TIM-47)`.
  In the PR body, link [TIM-47](/TIM/issues/TIM-47),
  [TIM-99](/TIM/issues/TIM-99) (Plan), [TIM-100](/TIM/issues/TIM-100)
  (Apply), [TIM-101](/TIM/issues/TIM-101) (Simplify),
  [TIM-102](/TIM/issues/TIM-102) (Review), and the parent
  [TIM-3](/TIM/issues/TIM-3).
- [ ] 7.8 Hand off to the Simplifier ([TIM-101](/TIM/issues/TIM-101))
  with a comment on TIM-100 that names the PR number, the head
  commit, and the verification results
  (`flutter analyze` / `flutter test` / E2E gate status).
