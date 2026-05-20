## Context

B1 ([TIM-36](/TIM/issues/TIM-36)) audited the Flutter dependency surface
and flagged `hooks_riverpod` 2.6.1 as the only major bump remaining in
Wave 3 of Phase 2 ([TIM-3](/TIM/issues/TIM-3)). Audit slice B5
([TIM-47](/TIM/issues/TIM-47)) carved the work out as its own change
because it is the largest cross-cutting Dart-API change in the upgrade
program.

Current Riverpod state captured from the working tree at proposal time
(2026-05-20):

- **Imports.** 72 files under `app/lib/` import `hooks_riverpod`. The
  package is the only state-management library used by the modern
  modules.
- **Provider mix.** Three eras of Riverpod coexist:
  - **Legacy `StateNotifier`** — 5 files (assistant, hidden_event, two
    in event_details, school selection controller).
  - **Modern `AsyncNotifier`** — 5 providers (eventsProvider,
    eventsForViewProvider, userCalendarProvider,
    personalEventsProvider, calendarLogsProvider).
  - **Functional `Provider` / `StateProvider` / `FutureProvider`** —
    the rest, including `calendarEventsProvider` (StateProvider),
    `homeScreenDataProvider` (FutureProvider),
    `eventsForPlanningViewProvider` (FutureProvider),
    `schoolSearchProvider` (`StateProvider.autoDispose`),
    `schoolFilteredProvider` (`Provider.autoDispose`),
    `debugCalendarDetailsProvider` (`FutureProvider.autoDispose`), and
    several screen-local `StateProvider` instances.
- **`autoDispose` usage today.** Explicit `.autoDispose` is on only
  4 providers (`checklistItemProvider`, `schoolSearchProvider`,
  `schoolFilteredProvider`, `debugCalendarDetailsProvider`). Every
  other provider relies on the v2 default of `keepAlive`. This is the
  single largest semantic change in v3.
- **`ref.listen` usage.** Exactly one call site
  (`app/lib/modules/school/screens/school_selection/school_selection_screen.dart`,
  line 31) listening on `AsyncValue<BuiltList<SchoolForList>>`.
- **`ref.read(<provider>.notifier).<method>()` usage.** 39 occurrences
  across `app/lib/`. The ones that target the five migrating providers
  must follow the constructor-shape change (`Notifier`/`AsyncNotifier`
  receive `ref` as an instance member rather than via constructor) but
  the call sites themselves keep the `ref.read(...).<method>()` shape.
- **Tests.** One test file directly touches `StateNotifier` shape:
  `app/test/modules/school/controllers/school_selection_controller_test.dart`
  uses `controller.addListener` and a `_SeededSchoolController`
  subclass that sets `state = AsyncValue.data(...)` from the
  constructor. The other 4 migrating providers have no direct unit
  tests; their regression coverage is the Phase 1 E2E smoke suite
  ([TIM-7](/TIM/issues/TIM-7)).
- **`provider:` package.** A separate, unrelated package
  (`provider: ^6.0.2`) is still used in `app/lib/app.dart` lines
  61–62 for `SettingsProvider` and `CalendarProvider` via
  `ChangeNotifierProvider`. **OUT of scope** — its consolidation is
  [TIM-50](/TIM/issues/TIM-50) / Phase 3.
- **`state_notifier` package.** Not declared in `app/pubspec.yaml`.
  It is pulled in transitively through `flutter_riverpod` 2.x and
  drops out of the lockfile when the bump lands.

## Goals / Non-Goals

**Goals:**
- `hooks_riverpod` resolved at a v3 line in `app/pubspec.lock`
  (target floor `^3.3.1`), with `state_notifier` no longer present
  transitively.
- Zero `StateNotifier` / `StateNotifierProvider` usage in `app/lib/`
  or `app/test/` after the change.
- App runtime behaviour unchanged: every long-lived provider that
  previously relied on default `keepAlive` now calls `ref.keepAlive()`
  inside `build()`; every `AsyncNotifier` explicitly disables retry
  to preserve the v2 fail-fast UX.
- `flutter analyze` clean.
- Unit / widget tests (currently 50 passing in `app/test/`) green,
  including the rewritten `school_selection_controller_test.dart`.
- Phase 1 E2E smoke suite ([TIM-7](/TIM/issues/TIM-7)) green — that is
  the cross-module regression gate for the autoDispose changes.

**Non-Goals:**
- Migrating the `provider:` package (`ChangeNotifierProvider`,
  `SettingsProvider`, `CalendarProvider`). Deferred to
  [TIM-50](/TIM/issues/TIM-50) / Phase 3.
- Adopting Riverpod 3 code generation (`@riverpod` annotations,
  `_riverpod_generator`). The migration stays on the hand-written
  `Notifier` / `AsyncNotifier` shape that the modern providers in
  this repo already use.
- Refactoring provider organisation, naming, or file layout. The
  Notifier class names, file paths, and provider variable names are
  preserved exactly.
- Adding new tests beyond the rewrite of the one existing
  `school_selection_controller_test.dart` file. New test coverage is
  the responsibility of [TIM-4](/TIM/issues/TIM-4) / Phase 1 test
  foundation and follow-on issues, not this dependency bump.
- Touching the `server/`, `openapi/`, `web/`, or native platform
  configuration.

## Decisions

### D1. Use the hand-written `Notifier` / `AsyncNotifier` API, not codegen

The codebase's modern providers (`EventsNotifier`,
`UserCalendarsNotifier`, `PersonalEventsNotifier`, `CalendarLogsNotifier`,
`EventsForViewNotifier`) are already hand-written `AsyncNotifier`
subclasses with explicit `AsyncNotifierProvider<…, …>(Notifier.new)`
wiring. Continuing that pattern for the five legacy migrations keeps
the file diff small, matches the surrounding style, and avoids pulling
in `riverpod_generator` + a second build_runner pass.

**Alternative considered:** Adopt `@riverpod` codegen across the
project. **Rejected** for this change — it widens scope to every
provider in `app/lib/`, adds a build_runner target, and is itself a
multi-day migration. Track separately if desired.

### D2. Sync providers map to `Notifier`, async providers map to `AsyncNotifier`

The four sync `StateNotifier` migrations (assistant, hidden_event,
event_nb_checklist_items, checklist_item) become
`Notifier<T>` / `NotifierProvider<…, T>`. The one async
`StateNotifier<AsyncValue<…>>`
(`SchoolSelectionController`) becomes `AsyncNotifier<BuiltList<SchoolForList>>`
/ `AsyncNotifierProvider<…, BuiltList<SchoolForList>>`, with the
`fetch()` call relocated into `build()`. The state type unwraps the
`AsyncValue` because `AsyncNotifier` exposes `AsyncValue<T>` through
its `state` field automatically.

**Alternative considered:** Keep `SchoolSelectionController` as a
sync `Notifier<AsyncValue<…>>` to minimise call-site changes.
**Rejected** — that path leaves the controller doing its own
`AsyncValue.loading` / `AsyncValue.data` / `AsyncValue.error`
plumbing and loses the `AsyncNotifier` defaults that the other
five async providers already use. The downstream consumers
(`schoolFilteredProvider`, the `ref.listen` in
`school_selection_screen.dart`) already speak `AsyncValue` and do
not change shape.

### D3. Explicit `ref.keepAlive()` on every previously-keepAlive provider

Riverpod 3 flips the default lifetime from `keepAlive` to
`autoDispose`. Any provider that today has no `.autoDispose` modifier
is implicitly long-lived. After the bump those providers would dispose
when their last listener unmounts, which would, for example, refetch
the entire events list every time the user navigates away from and back
to a screen. The safe, behaviour-preserving fix is to call
`ref.keepAlive()` inside `build()` for every such provider.

The 17 providers that need explicit `ref.keepAlive()` are enumerated
in `proposal.md` → `What Changes` → bullet 3. The four providers that
already declare `.autoDispose` are unchanged in lifetime — the
`.autoDispose` modifier becomes redundant and is dropped, but the
behavior is identical.

**Alternative considered:** Treat the `autoDispose`-by-default as the
new normal and let providers dispose; rely on `ref.watch` re-creating
state as needed. **Rejected** — it is a behaviour change, not a
behaviour-preserving migration. Wrong scope for a dependency bump.

### D4. Explicit `retry => null` on every `AsyncNotifier`

Riverpod 3 ships a default `Retry` policy on `AsyncNotifier` that
exponentially backs off on failure. The codebase's screens
(`school_selection_screen.dart`, `activity_screen.dart`, etc.)
already render the `AsyncValue.error` state directly to the user with
a retry button, and tests like `school_selection_controller_test.dart`
assert that a failed `fetch()` surfaces `AsyncValue.error` on the
first attempt. The migration overrides `Retry get retry => null` (or
equivalent) on every `AsyncNotifier` to preserve the v2 fail-fast
behaviour.

**Alternative considered:** Accept the v3 default retry. **Rejected**
— it changes user-visible loading behaviour in screens that already
have retry UX, and would mask real network errors behind silent
in-Notifier retries.

### D5. Rewrite the one existing unit test, do not add new coverage

`school_selection_controller_test.dart` is the only test touching
`StateNotifier` shape. Its three subtests are kept in spirit
(fetch-success populates state; filter by name; filter by code) but
rewritten to the `AsyncNotifier` test pattern: override the provider
with a subclass whose `build()` returns the seeded list, and read
state via `container.read(provider.future)` /
`container.read(provider)`. The two filter tests already use a
seeded controller and a fresh `ProviderContainer`; only the
constructor-shape and the listener-based fetch assertion change.

**Alternative considered:** Add new unit tests for the four other
migrated providers. **Rejected** for this change — test foundation
is a Phase 1 deliverable ([TIM-4](/TIM/issues/TIM-4),
[TIM-6](/TIM/issues/TIM-6)), and growing it as a side-effect of a
dep-upgrade conflates two scopes. The regression gate for the
unsigned-tested providers is the Phase 1 E2E smoke suite
([TIM-7](/TIM/issues/TIM-7)) plus `flutter analyze`.

### D6. Apply in one PR, broken into logical commits

The Applier ([TIM-100](/TIM/issues/TIM-100)) ships a single PR but
the tasks (see `tasks.md`) are grouped into 7 commits so the
diff stays reviewable:

1. Pubspec bump + `flutter pub get` (lockfile churn isolated).
2. Migrate the five `StateNotifier` files to
   `Notifier` / `AsyncNotifier`, update the constructor-shape call
   sites that touch them.
3. Add `ref.keepAlive()` to every long-lived provider (17 providers).
4. Add `retry => null` override to every `AsyncNotifier` (6 providers
   after the school-selection migration).
5. Update the one `ref.listen` call site to the v3 signature.
6. Rewrite `school_selection_controller_test.dart` to the
   `AsyncNotifier` pattern.
7. Final `flutter analyze` + `flutter test` clean-up (any pure
   import-cleanup or unused-symbol fallout).

**Alternative considered:** One commit per provider migrated.
**Rejected** — too noisy for a coordinated cross-cutting change, and
the lifetime / retry alignments are project-wide policy, not
per-provider edits.

## Risks / Trade-offs

- **[Behaviour drift from missing a `ref.keepAlive` site]** → The
  Applier mitigates by enumerating every provider declaration
  (`grep -rn 'Provider<\|Provider((' app/lib/`) and ticking each one in
  `tasks.md`. The Phase 1 E2E smoke flows are the regression net — if
  a screen suddenly refetches when it shouldn't, the smoke flow will
  fail or the timing assertions will trip.
- **[Behaviour drift from v3 default retry on a provider that
  previously failed fast]** → Mitigated by explicit `retry => null`
  on every `AsyncNotifier` (Task 4) and a `grep` gate in Task 7
  confirming no `AsyncNotifier` subclass omits the override.
- **[Hidden API change in v3 we did not anticipate]** → The Applier
  runs `flutter analyze` after every commit. If a v3 CHANGELOG entry
  hits a call site that this design did not list, the Applier records
  the surprise in implementation notes and addresses it within this
  change rather than spinning a follow-up — the goal is one
  apply/simplify/review cycle for the whole migration.
- **[`hooks_riverpod` 3.x requires a Flutter / Dart SDK we do not
  have]** → Pre-flight: the repo declares `sdk: ">=3.9.0 <4.0.0"` in
  `app/pubspec.yaml`, and `hooks_riverpod` 3.3.1 requires Dart
  `>=3.0.0`. No SDK bump is needed.
- **[Cocoapods / native-side breakage]** → None expected.
  `hooks_riverpod` is pure Dart with no native platform plug-ins.
  No `Podfile` / Gradle work in this change.

## Migration Plan

This is a one-shot in-place migration on a feature branch
(`TIM-99-riverpod-3-migration`, already created by the Planner). There
is no staged rollout, no feature flag, no shim layer. The Applier
implements every task in `tasks.md`, the Simplifier reviews for dead
code or accidental scope creep, the Reviewer checks the diff against
this design and `proposal.md`, and the PR merges to `main`.

**Rollback:** If a regression is discovered post-merge, revert the
single PR. Riverpod 2.6.1 and 3.3.1 are wire-compatible with the
underlying Dart SDK; there is no on-device migration step to undo.

**Verification (carried into Apply / Review):**
- `flutter analyze` clean.
- `flutter test` green from `app/`.
- Phase 1 E2E smoke flows green in CI.
- No `StateNotifier` / `StateNotifierProvider` matches in
  `app/lib/` or `app/test/` (`grep -rn 'StateNotifier' app/lib app/test`
  is clean).
- No `AsyncNotifier` subclass without a `retry` override
  (`grep -rn 'extends AsyncNotifier' app/lib` matches paired against
  `grep -rn 'Retry? get retry' app/lib`).
- `app/pubspec.lock` no longer carries a `state_notifier` entry.

## Open Questions

None at proposal time. The pre-flight check on 2026-05-20
([TIM-47](/TIM/issues/TIM-47) wake comment) confirmed every
load-bearing fact (real dep, 5 StateNotifier files, transitive
`state_notifier`, `provider:` package out of scope) and the working
tree matches.
