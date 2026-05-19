## Context

A1 (`flutter-test-foundation`) delivered the harness: `mocktail`, the
`test/` ⇄ `lib/modules/` mirror layout, the `pumpApp` widget helper
(`test/support/pump_app.dart`), and `test/README.md`. A3 is the first change
to actually use it at scale. The constraint is to add *nominal* coverage —
the happy path of each piece of core logic — without chasing edge cases or
touching production code.

## Goals / Non-Goals

**Goals:**
- Regression tests for the highest-value logic in `app/lib/modules/`.
- Each test file independently runnable and verifiable (`flutter test <file>`).
- Tests follow the A1 exemplars and `README.md` patterns exactly.

**Non-Goals:**
- Coverage targets; error-path / edge-case exhaustion.
- Production code changes, refactors, or making hard-to-test code testable
  by changing it (flag such code instead — see Risks).
- E2E/integration tests (TIM-5) and CI changes (already done in A1).

## Module selection — why these

The candidate list was triaged by **regression value per line of test code**.
Pure logic with branching or arithmetic is included; thin pass-through code and
plugin-bound UI are deprioritised.

| Module / file | Included | Rationale |
|---|---|---|
| `calendar/helpers/*` | ✅ | Pure functions, no Flutter binding — overlap math and date bucketing feed every calendar view. Highest value/line. |
| `calendar/models/ui/event_for_ui.dart` | ✅ | The column-placement algorithm for overlapping events — the most intricate logic in the app and the easiest to break silently. |
| `calendar/models/{calendar_event,event_tag,calendar_event_custom_fields}.dart` | ✅ | DB serialization round-trips; a broken `toDbMap`/`fromInternalDb` corrupts the local cache. |
| `event_details/models/checklist_item.dart` | ✅ | Map round-trip + uuid auto-generation; same serialization-regression risk. |
| `event_details/controllers/checklist_focus_controller.dart` | ✅ | Small, pure, fully deterministic listener registry — cheap to lock down. |
| `event_details/widgets/event_details_checklist_item.dart` | ✅ | The one checklist widget with real interaction logic (checkbox, text edit, remove) and **no** provider/plugin coupling — the natural widget-test exemplar for A3. |
| `school/controllers/school_selection_controller.dart` | ✅ | `fetch()` happy path + `schoolFilteredProvider` filtering; exercises the mocktail-mocked API-client pattern end to end. |
| `settings/providers/settings_provider.dart` | ✅ | `loadSettings` defaulting logic and the color/theme helpers; needs plugin mock-values (see below) but the defaulting logic is genuinely worth guarding. |
| `onboarding/screens/onboarding_screen.dart` | ✅ (lowest priority) | Named candidate; included for widget-test breadth. It is pure presentational UI with the most test friction (legacy `provider` + SharedPreferences in `initState`) and the least logic — do it last; it may be dropped if the `initState` coupling proves costly, without affecting the rest of the change. |
| `calendar` controllers/providers/repositories/services, other widgets | ❌ | Need Riverpod wiring, sembast, or Firebase — disproportionate setup for nominal scope; defer to a later coverage pass. |

## Decisions

**Shared fixture builders in `test/support/fixtures.dart`.** Several domain
objects (`CalendarEvent`, the built_value `SchoolForList`/`FindSchoolsRepDto`)
have long required-argument lists. A `buildCalendarEvent({...})` /
`buildSchoolForList({...})` builder with sensible defaults keeps tests
readable and means a future constructor change updates one place. This sits in
`test/support/` next to `pump_app.dart` — test-only, never shipped.
`CalendarEvent` implements `EventInterface`, so `buildCalendarEvent` doubles as
the fixture for every helper/`EventForUI` test.

**calendar helpers — plain `test()`/`group()`.** No Flutter binding; follow the
`ColorUtils` exemplar. `getEventsForWeekView` uses
`AppDateUtils.dayAtWeekNumber` — week 0 begins on the first Monday on/after
2000-01-01 (2000-01-03); fixtures place events relative to that anchor so the
tests are deterministic and timezone-independent.

**school controller — mock the `ApiClient` chain.** `SchoolSelectionController`
takes an injected `ApiClient`; the test constructs it directly with a
`MockApiClient` whose `schoolsApi()` returns a `MockSchoolsApi` whose
`findSchools()` resolves to a `Response<FindSchoolsRepDto>`. This tests the
controller without `apiClientProvider`/`dio`. `schoolFilteredProvider` is tested
in a `ProviderContainer` that overrides `schoolSelectionControllerProvider` with
a seeded state and drives `schoolSearchProvider`. Register `mocktail` fallback
values in `setUpAll` per the README.

**settings provider — plugin mock-values, not channel stubs.**
`SettingsProvider.loadSettings` reads `shared_preferences`, `pref`
(`PrefServiceShared`) and `package_info_plus`. The test calls
`TestWidgetsFlutterBinding.ensureInitialized()` then
`SharedPreferences.setMockInitialValues({})` and
`PackageInfo.setMockInitialValues(...)` — the standard test APIs — so no raw
`MethodChannel` mocking is needed. `SettingsProvider` is a singleton
(`factory` returns `_instance`); each test re-runs `loadSettings` to get a known
state, and tests do not assume isolation beyond that.

**onboarding widget — legacy `provider` wrapper.** `OnboardingScreen.initState`
calls `Provider.of<SettingsProvider>(context, listen: false)`, so `pumpApp`
alone is insufficient: wrap the screen in a
`ChangeNotifierProvider<SettingsProvider>.value`. Because the `currentVersion`
setter writes to `SharedPreferences`, the provided `SettingsProvider` must have
`loadSettings` run against `SharedPreferences.setMockInitialValues` first, or
the post-frame microtask throws a `LateInitializationError` on `prefs`.

## Risks / Trade-offs

- **`settings_provider` is a process-wide singleton.** Tests share one
  instance; mitigated by re-running `loadSettings` per test. If cross-test
  bleed appears, note it for the Simplify/Review stages rather than refactoring
  `lib/` here.
- **`onboarding_screen` is hard to test for low value.** Its `initState`
  side-effect couples it to two plugins. The task is sequenced last and is
  explicitly droppable; the rest of the change does not depend on it.
- **built_value fixtures for `SchoolForList` are verbose** (nested required
  `SchoolAssistant`). Centralising them in `fixtures.dart` contains the cost.
- **No edge cases by design.** Null/empty/error paths are out of scope; a
  follow-up change can deepen coverage once the nominal suite is green.

## Migration Plan

Additive only — new files under `app/test/`. No `lib/`, `pubspec.yaml` or CI
changes. Reverting the change deletes the test files with no other effect.

## Open Questions

- None blocking. Whether `onboarding_screen` coverage is worth its setup cost
  is left to the Applier's judgement during implementation (see task 8).
