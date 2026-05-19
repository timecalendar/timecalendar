# Tasks

Conventions:
- Flutter SDK is not on `PATH`: prefix Flutter/Dart commands with
  `export PATH="/home/dev/flutter/bin:$PATH"`.
- Backend commands run from `server/`; Flutter commands from `app/`.
- The harness runs the backend with `NODE_ENV=test` (database
  `timecalendar_test`) and `PORT=3005`. Never run `db:init` against the dev
  `timecalendar` database.
- Read `design.md` before starting — Decisions 1 (per-file process isolation),
  3 (relative-date calendar fixtures) and 4 (two boot states) are load-bearing.
- The dev host has no Android emulator: full green is proven by CI. Each task
  states the verification possible locally.

## 1. Backend calendar fixtures

- [ ] 1.1 Add a `Calendar` fixture seeding one calendar with a known constant
  `token` (e.g. `e2e-smoke-calendar`), `name`, `url`, timestamps, linked to the
  `@mygamingacademia` school — at `server/src/modules/calendar/fixtures/`.
  Match the `Calendar` entity field names exactly
  (`server/src/modules/calendar/models/calendar.entity.ts`).
- [ ] 1.2 Add a `CalendarContent` fixture for that calendar with 2–3 events in
  its `events` JSON array (`uid`, `title`, `startsAt`, `endsAt`, `location`,
  `allDay`, `description`, `teachers`, `tags`, `type`, `exportedAt`). Events
  MUST be dated relative to the seed run so they fall in the current-week
  calendar view — see design.md Decision 3. First verify whether the installed
  `typeorm-fixtures-cli` evaluates `<( )>` expressions inside a JSON column; if
  not, append a small guarded relative-date E2E-calendar seed step to
  `server/src/scripts/seed-database.ts` instead. Use deterministic, assertable
  titles/locations (e.g. `Cours E2E Test`, `Salle E2E`).
- [ ] 1.3 Verify: from `server/`, `NODE_ENV=test PORT=3005 npm run db:init`
  succeeds, then `NODE_ENV=test PORT=3005 npm run start` boots and
  `curl -s -X POST localhost:3005/calendars/sync -H 'Content-Type:
  application/json' -d '{"calendars":[{"token":"e2e-smoke-calendar"}]}'`
  (adjust to the real `SyncCalendarsDto` shape) returns the seeded events.

## 2. Local-DB test helpers

- [ ] 2.1 Extend `app/lib/modules/shared/test_utils/test_utils.dart` with
  `resetLocalAppState()` (clears SharedPreferences + the Sembast store) and
  `seedUserCalendar(...)` (inserts a `UserCalendar` via the existing
  `userCalendarRepository`, with the `token` matching task 1.1). Reuse existing
  models/repositories — no new production behaviour. See design.md Decision 5.
- [ ] 2.2 Verify: from `app/`, `flutter analyze` is clean for the changed file.

## 3. Onboarding + add-school flow

- [ ] 3.1 Add `app/integration_test/onboarding_flow_test.dart`. With an empty
  local DB the app boots to onboarding. The test (one `testWidgets`, with a
  per-test `timeout:`):
  - `resetLocalAppState()` then `waitAppInitialized(tester)`.
  - Assert onboarding page 1 (`find.text('Consultez votre agenda')`).
  - Walk pages via **"Suivant"**, asserting page 2
    (`Recevez des notifications`) and page 3 (`Bienvenue dans TimeCalendar !`);
    finish with **"C'est parti !"** (or take the **"Passer"** shortcut once) →
    routes to `SelectSchool`.
  - Wait for the live `GET /schools` with the bounded-pump pattern (no
    `pumpAndSettle` — design.md Decision 6); assert `My Gaming Academia` and
    `Université Gustave Eiffel` render.
  - Tap `My Gaming Academia`; assert the add-school assistant flow advances
    (the next native screen — `AddGradeScreen` for the `generic` assistant —
    appears). Do not drive the assistant WebView (design.md Decision 2).

## 4. Calendar + event-details + settings flow

- [ ] 4.1 Add `app/integration_test/calendar_flow_test.dart`. The test (one
  `testWidgets`, per-test `timeout:`):
  - `resetLocalAppState()`, then `seedUserCalendar(token: 'e2e-smoke-calendar',
    ...)`, then `waitAppInitialized(tester)` → boots to `TabsScreen`.
  - Open the **Calendrier** tab; with the bounded-pump pattern wait for the
    seeded events to sync from `POST /calendars/sync`; assert a seeded event
    (e.g. `Cours E2E Test`) is visible.
  - Tap that event → assert `EventDetailsScreen` shows the event title and
    location.
  - Navigate back, open the **Profil** tab → tap **"Paramètres"** → assert
    `SettingsScreen` (`find.text('Paramètres')`); toggle one preference switch
    (e.g. *Afficher les week-ends*) and assert the toggle reflects.

## 5. Harness: run every flow file

- [ ] 5.1 Update `app/integration_test/run_e2e.sh` to run **each**
  `integration_test/*_flow_test.dart` file as its own `flutter test`
  invocation (separate process — design.md Decision 1), under the existing
  `timeout` backstop, with the same `--dart-define` wiring. Aggregate results:
  the script exits non-zero if any flow fails, and reports per-flow pass/fail.
  Remove the now-superseded `app_test.dart` reference.
- [ ] 5.2 Delete `app/integration_test/app_test.dart` (superseded by the flow
  files; its happy path is folded into `onboarding_flow_test.dart`).
- [ ] 5.3 Verify the non-device path locally: run `run_e2e.sh` on the dev host
  (no emulator) — steps 1–6 (backend boot + seed, including the new calendar
  fixture) succeed and it fails fast at device resolution, then tears down
  cleanly.

## 6. CI

- [ ] 6.1 Update the `test-e2e` job in `.github/workflows/build.yaml` so it runs
  the full flow suite (via `run_e2e.sh`, which now runs every flow file). Keep
  the generous `timeout-minutes` for emulator cold boot.
- [ ] 6.2 Verify the workflow YAML is well-formed (`actionlint`/`yq` if
  available, else a careful diff against the existing jobs). Triggering the run
  needs the repo owner — note this in the handoff.

## 7. Documentation

- [ ] 7.1 Update `app/integration_test/README.md`: replace the "one test by
  design / how to add a flow" section with the per-file process-isolation model
  (Decision 1), how to add a new `*_flow_test.dart`, the local-DB seed helpers,
  and the explicit out-of-scope list (assistant WebView completion, auth, etc.).

## 8. Verification

- [ ] 8.1 From `app/`, `flutter analyze integration_test` and
  `flutter analyze lib/modules/shared/test_utils` are clean.
- [ ] 8.2 Local non-emulator verification per task 5.3 done; record that the
  canonical green run is the CI `test-e2e` job. Do not mark a green run that
  did not happen — escalate the local-emulator gap in the PR/handoff, same as
  A2 task 6.
