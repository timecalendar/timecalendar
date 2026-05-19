## Why

A2 (`e2e-smoke-harness`, TIM-5) gave the app a one-command harness that boots
the NestJS backend + Postgres and runs **exactly one** Flutter `integration_test`
against it. That single happy-path test proves the harness works, but it only
exercises `GET /schools` — it is not yet a smoke suite.

This change (TIM-7 / A4) turns the harness into a real smoke suite: nominal
end-to-end tests for the critical user journeys — onboarding, add school, view
calendar, event details, settings. These are the tests that let us roll out
features and (in Phase 2) upgrade dependencies with confidence. The emphasis is
**nominal and flake-free**, not exhaustive.

## What Changes

No production (`app/lib/` runtime, `server/src/`) behaviour changes — only
test/fixture/orchestration/CI assets. (`app/lib/modules/shared/test_utils/` is
test-support code that already ships in `lib/` so `integration_test/` can import
it — A2 convention; this change extends it.)

- **Test isolation via separate processes.** A2 documented that the suite ships
  one test because `app.main()` calls `Firebase.initializeApp`, which throws
  `[core/duplicate-app]` on a second call in the same process. A4 solves this
  the no-production-code way: each flow lives in its own `integration_test/`
  entrypoint file, and `run_e2e.sh` / CI run each file as a **separate
  `flutter test` invocation** — a fresh process, so `Firebase.initializeApp`
  runs exactly once per file.
- **Two flow entrypoints**, replacing the single `app_test.dart`:
  - `onboarding_flow_test.dart` — boots with **no** local calendar (→ onboarding):
    walk the 3 onboarding pages → `SelectSchool` → assert the two seeded schools
    load over the live backend → tap a school → assert the add-school assistant
    flow advances. Covers **onboarding** + **add school**.
  - `calendar_flow_test.dart` — boots with a **pre-seeded** local calendar
    (→ `TabsScreen`): assert the calendar tab renders the events synced from the
    backend → open an event → assert `EventDetailsScreen` → navigate to
    **Settings** and toggle a preference. Covers **view calendar**, **event
    details**, **settings**.
- **Deterministic backend calendar data.** New fixtures seed a `Calendar` +
  `CalendarContent` (token-addressable, with a couple of events dated relative
  to the seed run) so `POST /calendars/sync` returns real events with **no
  external university iCal call** — the add-school assistant resolves calendars
  from external sites, which a flake-free smoke test must not depend on.
- **Local-DB test helpers.** `test_utils.dart` gains helpers to seed a
  `UserCalendar` into the local Sembast DB and to reset local state, so a flow
  can boot straight into `TabsScreen` deterministically.
- **`run_e2e.sh`** runs every `integration_test/*_flow_test.dart` file, each in
  its own process; the script fails if any flow fails.
- **CI `test-e2e` job** updated to run the full flow suite on the emulator.
- **`README.md`** updated: documents the per-file process isolation, how to add
  a flow, and what is intentionally out of scope.

## Capabilities

### New Capabilities
- `e2e-smoke-flows`: nominal end-to-end smoke tests for the critical user
  journeys (onboarding, add school, view calendar, event details, settings),
  built on the A2 harness, each flow isolated in its own test process.

### Modified Capabilities
<!-- The A2 `e2e-smoke-harness` script/CI are extended (multi-file run) but its
contract is unchanged: boot backend + DB, seed, run integration_test, tear
down. -->

## Impact

- `app/integration_test/onboarding_flow_test.dart` — new (covers the former
  `app_test.dart` happy path and extends it).
- `app/integration_test/calendar_flow_test.dart` — new.
- `app/integration_test/app_test.dart` — removed (superseded by the flow files).
- `app/integration_test/run_e2e.sh` — runs each flow file in its own process.
- `app/integration_test/README.md` — updated.
- `app/lib/modules/shared/test_utils/test_utils.dart` — new local-DB seed/reset
  helpers (test-support code).
- `server/src/modules/calendar/fixtures/*.yml` — new `Calendar` +
  `CalendarContent` fixtures.
- `.github/workflows/build.yaml` — `test-e2e` job runs the flow suite.
- No `app/lib/` runtime, `server/src/` runtime, DTO or `pubspec.yaml` changes.
