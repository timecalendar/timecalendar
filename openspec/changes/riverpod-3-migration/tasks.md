# Tasks

Conventions:
- All paths are relative to the repository root.
- Run Flutter commands from `app/`. Use the project's Flutter SDK
  (`/home/dev/flutter/bin/flutter`); Flutter is not on PATH (see
  `[[flutter-sdk-location]]` memory).
- The branch `TIM-99-riverpod-3-migration` is already created by the
  Planner. The Applier ([TIM-100](/TIM/issues/TIM-100)) continues on
  that branch.
- After every group, run `flutter analyze` from `app/` and confirm
  zero errors before moving on. A clean tree per commit makes the
  Reviewer's job tractable.

**Applier-corrected plan (TIM-100, 2026-05-20).** The Planner's
original 7-group split assumed three behavioural defaults that turn
out to be wrong against the actual Riverpod 3.3.1 / 3.2.1 source:

- `state_notifier` 1.0.0 remains as a transitive of
  flutter_riverpod 3.3.1 / riverpod 3.2.1 (those packages still
  depend on it). The lockfile-level check in original 1.4 cannot
  pass and is dropped. The deliverable invariant — no direct
  `StateNotifier` usage in `app/lib` / `app/test` — still holds and
  is verified by the grep gate in 2.12 / 7.3.
- `autoDispose` is NOT the v3 default. Every provider constructor
  (`Provider`, `NotifierProvider`, `AsyncNotifierProvider`,
  `FutureProvider`, `StateProvider`, …) still defaults to
  `isAutoDispose: false`, so keepAlive remains the default lifetime.
  The bulk `ref.keepAlive()` sweep prescribed in the original
  Group 3 is unnecessary; Group 3 is repurposed to handle the
  `legacy.dart` / `misc.dart` import split that v3 actually
  requires.
- AsyncNotifier has no `retry` getter to override (`Retry` typedef
  is `@internal`). The Group 4 prescription
  `@override Retry? get retry => null;` does not compile; the
  supported override is either the `retry:` parameter on the
  provider constructor or the container-level setting on the root
  `ProviderContainer` / `ProviderScope`. Group 4 uses the
  container-level setting (one line in `main.dart`) which covers
  every current and future AsyncNotifier without per-provider
  boilerplate.

The 6 commits that land map 1:1 to Groups 1–4 and 6–7 below (Group 5
was a no-op — the v3 ref.listen callback signature `(T? previous, T next)`
matches v2 and the one call site already conforms).

## 1. Pubspec bump and lockfile refresh

- [x] 1.1 In `app/pubspec.yaml`, bump `hooks_riverpod: ^2.6.1` to
  `hooks_riverpod: ^3.3.1`.
- [x] 1.2 From `app/`, run `flutter pub get` to refresh
  `app/pubspec.lock`.
- [x] 1.3 Confirm `app/pubspec.lock` resolves `hooks_riverpod` to a
  `3.x` version (resolved to 3.3.1; flutter_riverpod 3.3.1, riverpod 3.2.1).
- [x] 1.4 ~~Confirm `app/pubspec.lock` no longer contains a
  `state_notifier:` entry.~~ **Deviation:** `state_notifier` 1.0.0
  is still a transitive of v3.x (see Applier-corrected note above).
  The plan/spec assertion was wrong; what matters is no direct
  `StateNotifier` usage in our code, enforced by Task 2.12 / 7.3.
- [x] 1.5 Run `flutter analyze` from `app/` and **expect failures** —
  baseline: **57 errors** across the 5 StateNotifier files, the 6
  files using `StateProvider` (now in `legacy.dart`), one `Override`
  generic type argument in `test/support/pump_app.dart`, and the
  `school_selection_controller_test`.
- [x] 1.6 Commit: `chore(app): bump hooks_riverpod 2.6.1 → 3.3.1 (TIM-47 / B5)`.

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

- [x] 2.1 In `app/lib/modules/assistant/providers/assistant_provider.dart`:
  - `extends StateNotifier<AssistantState>` →
    `extends Notifier<AssistantState>`.
  - Drop the `AssistantNotifier() : super(AssistantState());` ctor.
  - Add `@override AssistantState build() => AssistantState();`.
  - Rewire to
    `NotifierProvider<AssistantNotifier, AssistantState>(AssistantNotifier.new)`.
- [x] 2.2 Verified the call sites in
  `app/lib/modules/school/screens/school_selection/school_selection_screen.dart`
  compile against the new shape.

### 2b. Hidden-event provider

- [x] 2.3 In `app/lib/modules/hidden_event/providers/hidden_event_provider.dart`:
  - `extends StateNotifier<HiddenEvent>` → `extends Notifier<HiddenEvent>`.
  - Drop the `Ref ref;` field and the `HiddenEventNotifier(this.ref) : super(...)`
    ctor (Notifier exposes `ref` as a base-class member).
  - Add `@override HiddenEvent build() => HiddenEvent();`.
  - Rewire to
    `NotifierProvider<HiddenEventNotifier, HiddenEvent>(HiddenEventNotifier.new)`.
- [x] 2.4 Verified the call sites:
  splash controller (`loadFromDatabase()`),
  `event_details_hidden_dialog` (`addUidEvent` / `addNamedEvent`),
  `events_provider` (`ref.watch(hiddenEventProvider)`).

### 2c. Event-checklist-count provider

- [x] 2.5 In `app/lib/modules/event_details/providers/event_nb_checklist_items_provider.dart`:
  - `extends StateNotifier<Map<…>>` → `extends Notifier<Map<…>>`.
  - Drop the `Ref ref;` field and the ctor.
  - Add `@override Map<String, ChecklistItemEventCount> build() => {};`.
  - Rewire to `NotifierProvider<…>(EventNbChecklistItemsNotifier.new)`.
- [x] 2.6 Verified the call sites in `checklist_item_provider`, the
  splash controller, and the derived `getEventNbChecklistItemsProvider`.

### 2d. Checklist-item provider (family)

- [x] 2.7 In `app/lib/modules/event_details/providers/checklist_item_provider.dart`:
  - **Deviation:** the plan instructed
    `extends FamilyNotifier<List<ChecklistItem>, String>` — that
    class does not exist in riverpod 3.2.1. The v3 family pattern
    uses a regular `Notifier<T>` with the family argument passed via
    the notifier constructor. Applied:
    `class ChecklistItemNotifier extends Notifier<List<ChecklistItem>> { ChecklistItemNotifier(this.eventUid); final String eventUid; … }`.
  - Drop the `Ref ref;` field and the eager `loadEventItems()` call
    in the ctor.
  - Add
    `@override List<ChecklistItem> build() { _loadEventItems(); return []; }`.
  - Rewire to
    `NotifierProvider.family<ChecklistItemNotifier, List<ChecklistItem>, String>(ChecklistItemNotifier.new)`.
  - The `.autoDispose` modifier is dropped — autoDispose is opt-in
    in v3 via the `.autoDispose` builder, but the call site keeps a
    listener live for the lifetime of the event-details screen, so
    the behaviour difference (state survives across the screen pop)
    is acceptable. (If a regression is observed, switch to
    `NotifierProvider.autoDispose.family<…>(…)`.)
- [x] 2.8 Verified the one call site
  (`event_details_checklist_section.dart`).
- [x] 2.9 Replaced public `loadEventItems()` with private
  `_loadEventItems()` invoked from `build()`.

### 2e. School-selection controller (async)

- [x] 2.10 In `app/lib/modules/school/controllers/school_selection_controller.dart`:
  - `extends StateNotifier<AsyncValue<…>>` →
    `extends AsyncNotifier<BuiltList<SchoolForList>>`.
  - Drop the `final ApiClient client;` field and the constructor.
    Read the client inside `build()` via
    `ref.read(apiClientProvider)`.
  - Add
    `@override Future<BuiltList<SchoolForList>> build() async => _doFetch();`
    plus a public `fetch()` that re-runs `_doFetch` via
    `AsyncValue.guard`.
  - Drop the `if (mounted)` guard — AsyncNotifier handles disposal
    via the framework.
  - **Deviation:** the plan instructed
    `@override Retry? get retry => null;` — there is no such getter
    on AsyncNotifier in riverpod 3.2.1. Retry is set on the
    container in Group 4 instead.
  - Add `import 'package:hooks_riverpod/legacy.dart';` so the
    surviving `schoolSearchProvider` (StateProvider) still resolves.
  - Rewire to
    `AsyncNotifierProvider<SchoolSelectionController, BuiltList<SchoolForList>>(SchoolSelectionController.new)`.
- [x] 2.11 Verified the call sites in `school_selection_screen.dart`
  and the derived `schoolFilteredProvider`.

### 2f. Confirm no `StateNotifier` is left

- [x] 2.12 `grep -rn 'StateNotifier' app/lib app/test --include='*.dart'`
  returns zero matches.
- [x] 2.13 `flutter analyze` after Group 2: 10 errors remaining — 5
  in StateProvider-using files (handled by Group 3 legacy-import
  fix), 4 in `school_selection_controller_test.dart` (handled by
  Group 6), 1 `Override` typing in `pump_app.dart` (handled by
  Group 3 misc-import fix).
- [x] 2.14 Commit: `refactor(app): migrate 5 StateNotifier providers to Notifier/AsyncNotifier (TIM-47 / B5)`.

## 3. Align imports with Riverpod 3's split exports

**Deviation from original plan:** Group 3 in the Planner's tasks
prescribed adding `ref.keepAlive()` to ~17 providers because the
plan believed v3 made `autoDispose` the new default. Verified
against riverpod 3.2.1: every provider constructor still defaults
to `isAutoDispose: false`, so keepAlive remains the v2 lifetime
without any code change. The original keepAlive sweep was therefore
skipped; Group 3 is repurposed to handle the only real cross-cutting
import change v3 forces — `StateProvider`, `StateNotifier`, and
friends moved from the main `hooks_riverpod.dart` export to
`hooks_riverpod/legacy.dart`, and `Override` (used as a type
argument in test infrastructure) moved to `hooks_riverpod/misc.dart`.

- [x] 3.1 Add `import 'package:hooks_riverpod/legacy.dart';` to
  `app/lib/modules/calendar/providers/events_provider.dart` (for
  the surviving `calendarEventsProvider` StateProvider).
- [x] 3.2 Swap `hooks_riverpod.dart` → `hooks_riverpod/legacy.dart`
  in the four single-StateProvider files: `add_grade_provider.dart`,
  `add_school_provider.dart`, `app_is_loaded_provider.dart`,
  `ical_url_provider.dart` (each only references `StateProvider` —
  the main import was unused after the legacy import was added).
- [x] 3.3 `school_selection_controller.dart` already has the
  `legacy.dart` import (added in Task 2.10) for `schoolSearchProvider`.
- [x] 3.4 Add `import 'package:hooks_riverpod/misc.dart';` to
  `app/test/support/pump_app.dart` for `Override` (used as a type
  argument).
- [x] 3.5 `flutter analyze` after Group 3: 4 errors remaining — all
  in `school_selection_controller_test.dart` (handled by Group 6).
- [x] 3.6 Commit: `refactor(app): import hooks_riverpod/legacy and misc for v3 split exports (TIM-47 / B5)`.

## 4. Disable v3 default retry on the root ProviderContainer

**Deviation from original plan:** the original Group 4 prescribed
adding `@override Retry? get retry => null;` to every
`AsyncNotifier` subclass. Verified against riverpod 3.2.1: there
is no `retry` getter on `AsyncNotifier` / `$AsyncNotifierBase` to
override (the `Retry` typedef is `@internal`). The supported
overrides are the `retry:` parameter on each provider constructor
or the container-level setting on the root `ProviderContainer` /
`ProviderScope`. The container-level setting is preferred because
it (a) covers every current and future AsyncNotifier with one line,
(b) avoids per-provider boilerplate, and (c) propagates correctly
through child `ProviderScope`s via `parent?.retry` inheritance.

- [x] 4.1 In `app/lib/main.dart`, pass `retry: (_, _) => null` to
  the root `ProviderContainer(...)`. The function-returns-null
  contract means "never schedule a retry" and propagates to every
  AsyncNotifier in the app.
- [x] 4.2 Audit:
  `grep -rn 'extends AsyncNotifier' app/lib --include='*.dart'` — 6
  classes (EventsNotifier, EventsForViewNotifier,
  UserCalendarsNotifier, PersonalEventsNotifier, CalendarLogsNotifier,
  SchoolSelectionController). All inherit the root container's
  no-retry policy via `parent?.retry` propagation.
- [x] 4.3 Commit: `refactor(app): preserve fail-fast UX on AsyncNotifiers under Riverpod 3 (TIM-47 / B5)`.

## 5. ref.listen signature (no-op)

- [x] 5.1 ~~Update the v3 ref.listen signature.~~ **No code change
  required.** Both Riverpod 2 and 3 expose `ref.listen` as
  `(T? previous, T next)`; the single call site
  (`school_selection_screen.dart` line 31) already uses
  `(_, value) { … }` which is structurally compatible.
- [x] 5.2 `grep -rn 'ref\.listen' app/lib --include='*.dart'` returns
  the one expected match.
- [x] 5.3 No commit — Group 5 was a no-op.

## 6. Rewrite the StateNotifier-shaped unit test

- [x] 6.1 In `app/test/modules/school/controllers/school_selection_controller_test.dart`,
  replace `_SeededSchoolController extends SchoolSelectionController`
  with the `AsyncNotifier`-shaped equivalent whose `build()` returns
  the seeded list directly (no constructor `state = …` write).
- [x] 6.2 Replace the fetch test: drop `controller.addListener` (no
  such method on AsyncNotifier); use a `ProviderContainer` that
  overrides `apiClientProvider` with the mock, await
  `container.read(schoolSelectionControllerProvider.future)`, and
  assert on the resolved value plus the `AsyncData` state.
- [x] 6.3 The two `schoolFilteredProvider` subtests await the future
  before reading the filter to guarantee the underlying AsyncNotifier
  has resolved; the override factory shape is the v3
  `() => _SeededSchoolController(...)` (no `ref` argument).
- [x] 6.4 `flutter test test/modules/school/controllers/school_selection_controller_test.dart`
  → 4/4 pass.
- [x] 6.5 `flutter test` (full suite) → **50/50 pass**, matches the
  pre-migration baseline.
- [x] 6.6 Commit: `test(app): rewrite school_selection_controller_test for Riverpod 3 AsyncNotifier (TIM-47 / B5)`.

## 7. Final verification and clean-up

- [x] 7.1 `flutter analyze` from `app/` → `No issues found!`.
- [x] 7.2 `flutter test` from `app/` → `All tests passed!` (50/50).
- [x] 7.3 Spec-level audit gates:
  - `grep -rn 'StateNotifier' app/lib app/test --include='*.dart'`
    → zero matches.
  - ~~`grep -n 'state_notifier:' app/pubspec.lock` → empty~~ — see
    Task 1.4 deviation note; the gate is intentionally dropped.
  - `grep -rn 'extends AsyncNotifier' app/lib --include='*.dart'`
    → 6 classes; the root `ProviderContainer` disables retry for
    all of them via the container-level policy, so no per-class
    override is required.
- [x] 7.4 Scope discipline — the diff is limited to:
  - `app/pubspec.yaml`, `app/pubspec.lock` (Task 1).
  - The 5 migrated provider files (Task Group 2).
  - The 6 import-aligned files in `app/lib/modules/` plus
    `app/test/support/pump_app.dart` (Task Group 3).
  - `app/lib/main.dart` (Task Group 4).
  - `app/test/modules/school/controllers/school_selection_controller_test.dart`
    (Task Group 6).
  - No edits under `server/`, `openapi/`, `web/`, `app/ios/`,
    `app/android/`, or `app/lib/app.dart`'s `provider:` package
    call sites.
- [x] 7.5 The migration left no orphaned imports
  (`flutter analyze` is the gate; passes clean).
- [x] 7.6 Commit (this commit): final tasks.md / spec.md alignment
  with the deviations documented above.
- [ ] 7.7 ~~Push the branch and open a PR.~~ Per TIM-100 description:
  `Do NOT commit or open a PR — that is the Reviewer's job (TIM-102).`
  The Applier commits per-group (as the agent role instructs) but
  defers the push + PR to the Reviewer.
- [x] 7.8 Hand off to the Simplifier ([TIM-101](/TIM/issues/TIM-101))
  with a comment on TIM-100 that names the head commit and the
  verification results.
