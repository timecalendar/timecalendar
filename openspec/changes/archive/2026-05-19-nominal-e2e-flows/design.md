# Design — nominal E2E smoke flows (TIM-7 / A4)

Read alongside `app/integration_test/README.md` (A2). The harness mechanics
(backend boot, seed, dummy Firebase key, teardown, the `pumpAndSettle`-spinner
gotcha) are unchanged and not repeated here.

## Decision 1 — Test isolation: one process per flow

`app.main()` calls `Firebase.initializeApp`; a second call in the same process
throws `[core/duplicate-app]`, and `main.dart`'s `PlatformDispatcher.onError`
handler swallows it so the test merely *hangs*. A2 left this for A4.

Of A2's three documented options — (a) make boot idempotent, (b) one
`testWidgets` that navigates everything, (c) one entrypoint file per flow run in
its own process — A4 picks **(c)**.

- (a) requires production changes in `main.dart` *and* resetting the
  `SettingsProvider` / `SimpleDatabase` process-wide singletons between tests —
  invasive, and this takeover must not add production risk for test plumbing.
- (b) couples unrelated flows into one fragile mega-test and, critically, cannot
  cover both boot states: the app boots to **onboarding** xor **`TabsScreen`**
  depending on whether a local calendar exists (Decision 4) — two boots are
  required, so one process cannot do it.
- (c) is zero production code: each file is its own `flutter test` invocation =
  its own OS process = `Firebase.initializeApp` runs exactly once. Slower (one
  device session per file) but the suite is small and this is a smoke suite.

`run_e2e.sh` therefore globs `integration_test/*_flow_test.dart` and runs each
file separately, aggregating exit codes. New flows are added as new
`*_flow_test.dart` files with no harness change.

## Decision 2 — Scope of the "add school" flow

The add-school assistant (`/assistant`) is a **WebView** that loads the *web*
app (`MAIN_WEB_URL/assistants?...&embed=true`) and finishes by posting a
`calendarCreated` token back over a JS bridge. Driving a remote web embed from a
Flutter `integration_test` is neither nominal nor flake-free.

So the add-school smoke test asserts the **native** part only: the seeded
schools load from the live backend, and tapping a school *advances the assistant
flow* (for `My Gaming Academia`, assistant `generic` → `requireCalendarName`
routes to `AddGradeScreen`). Completing calendar creation through the WebView is
explicitly out of scope and noted in the README.

## Decision 3 — Deterministic calendar data without external network

The app never fetches university iCal URLs directly. It calls
`POST /calendars/sync` with calendar **tokens**; the backend returns each
`Calendar` with the events stored in its `CalendarContent`. The seeded schools'
calendars, however, resolve from **external** sites (`edt.univ-eiffel.fr`) — a
smoke test must not depend on those.

So A4 seeds a `Calendar` + `CalendarContent` fixture directly:

- `Calendar`: a known `token` (e.g. `e2e-smoke-calendar`), linked to the
  `mygamingacademia` school, with `name`, `url`, timestamps.
- `CalendarContent`: `events` is a JSON column — seed an array of 2–3 events
  (`uid`, `title`, `startsAt`, `endsAt`, `location`, `allDay`, `description`,
  `teachers`, `tags`, `type`, `exportedAt`).

`POST /calendars/sync` then returns these events with no external call.

**Event dates must be relative to the seed run** so they fall inside the
calendar's default (current-week) view. Preferred: typeorm-fixtures expression
support (`<( )>` JS expressions) for `startsAt`/`endsAt`. The Apply stage MUST
verify the installed `typeorm-fixtures-cli` evaluates such expressions in a JSON
column; if it does not, fall back to a tiny relative-date seed step appended to
`seed-database.ts` (guarded so it only adds the E2E calendar). Either way the
events land "today" relative to the run.

## Decision 4 — Two boot states, two flow files

`use_splash_controller.dart` routes to `TabsScreen` when the local Sembast DB
has ≥1 `UserCalendar`, else to `OnboardingScreen`.

- `onboarding_flow_test.dart` boots with an **empty** local DB → onboarding.
- `calendar_flow_test.dart` seeds a `UserCalendar` (matching the backend
  fixture `token`) into Sembast **before** `app.main()` → boots to `TabsScreen`,
  then `calendarSyncService` fetches the seeded events over `/calendars/sync`.

## Decision 5 — Local-DB test helpers

`test_utils.dart` gains:

- `resetLocalAppState()` — clears SharedPreferences and the Sembast store so a
  run never inherits a previous run's state (the emulator is fresh per CI run,
  but this keeps local re-runs deterministic).
- `seedUserCalendar(...)` — inserts a `UserCalendar` via the existing
  `userCalendarRepository` so `calendar_flow_test` boots to `TabsScreen`.

These call into existing repositories/`SimpleDatabase` — no new production
behaviour, just test fixtures expressed in Dart.

## Decision 6 — Waiting on live round-trips

Every assertion that depends on a backend round-trip (school list, calendar
sync) uses the A2 bounded-pump pattern, never `pumpAndSettle` (which never
settles against a running `CircularProgressIndicator`). Each `testWidgets`
keeps a per-test `timeout:` so a hang fails fast.

## Out of scope

- Completing the assistant WebView calendar creation (Decision 2).
- Auth / intranet-connected schools, QR-code import, personal events.
- Error-path / offline coverage — this is a *nominal* smoke suite.
- Production code changes or refactors.
