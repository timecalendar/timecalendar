# End-to-end smoke suite

`run_e2e.sh` is a single command that boots the **real NestJS backend +
Postgres**, seeds known data, runs the Flutter E2E smoke flows against the
live backend, and tears everything down. It exists so a breaking change to a
backend endpoint, its DTO, or the generated `timecalendar_api` client fails a
test instead of shipping silently.

The suite is **nominal and flake-free**, not exhaustive: it covers the
critical user journeys (onboarding, add school, view calendar, event details,
settings) so features can ship — and, in Phase 2, dependencies can be upgraded
— with confidence.

## The flows

Each flow is one `integration_test/*_flow_test.dart` entrypoint file, run as
its **own `flutter test` process** (see *Per-file process isolation* below):

- `onboarding_flow_test.dart` — boots with an **empty** local database (→
  onboarding): walks the three onboarding pages, loads the seeded schools over
  the live `GET /schools`, and asserts that tapping a school advances the
  native add-school assistant flow. Covers **onboarding** + **add school**.
- `calendar_flow_test.dart` — seeds a local `UserCalendar` before boot (→
  `TabsScreen`): asserts the calendar tab renders the events synced from
  `POST /calendars/sync`, opens an event, then navigates to **Settings** and
  toggles a preference. Covers **view calendar**, **event details**,
  **settings**.

## Run it

```bash
# The Flutter SDK is not on PATH on the dev host:
export PATH="/home/dev/flutter/bin:$PATH"

cd app
./integration_test/run_e2e.sh
```

The script exit code is the Flutter test's exit code.

Flags:

- `--keep-up` — leave the backend process and Docker containers running after
  the test (for debugging). Default is to tear everything down on success
  **and** failure.

## Prerequisites

- **Docker** + `docker compose` (Postgres and Redis run as containers).
- **Flutter SDK** on `PATH` (3.41.9 — matches the `test-app` CI job).
- **An Android emulator or device.** The app declares only `android`/`ios`
  platforms and `lib/main.dart` calls `Firebase.initializeApp` (no web / Linux
  support), so the unmodified app runs only on Android — see
  *Why Android only* below.
- `python3` (the script uses it to pick the Android device out of
  `flutter devices --machine`). The server half runs entirely inside Docker —
  `openssl`/`python3` for the dummy key live in `ci/generate-dummy-firebase-key.sh`,
  invoked by the lifecycle.

App (`flutter pub get`) dependencies are installed by the script if missing;
server dependencies live in the compose-built image, not on the host.

## What it does

The **server half** is owned by the shared, compose-first lifecycle
`ci/e2e-server.sh` (see `openspec/changes/add-mobile-test-harness`): Docker is
the lifecycle manager, so boot/seed/readiness/teardown/logs are Docker's job,
not hand-rolled bash. `run_e2e.sh` calls it and owns only the Flutter half.

1. `ci/e2e-server.sh up` — ensures the dummy Firebase key, brings Postgres,
   Redis, and the **server** up as compose-managed services with
   `docker compose up --wait` (gated on the server's `/health` healthcheck,
   itself gated on `postgres`/`redis` being healthy), then seeds
   `timecalendar_test` via a one-shot `compose run --rm server npm run db:init`
   (drop, migrate, load every `**/fixtures/*.yml`, then the guarded
   E2E-calendar seed step `server/src/scripts/seed-e2e-calendar.ts`). The API
   serves on host port 3005.
2. Resolves an Android device from `flutter devices`; exits fast with a clear
   message if none is connected.
3. Runs **each** `integration_test/*_flow_test.dart` file as its own
   `flutter test` invocation (a fresh process — see *Per-file process
   isolation*), with `--dart-define MAIN_API_URL=...` pointing at the local
   backend, each under a `timeout` backstop (`E2E_TEST_TIMEOUT`, default 720s)
   so a tool-level hang fails the run instead of stalling to the CI job's
   wall-clock limit. The script reports per-flow pass/fail and exits non-zero
   if **any** flow fails. On failure it dumps the server logs via
   `ci/e2e-server.sh logs`.
4. Tears down (`trap … EXIT`): `ci/e2e-server.sh down` removes the whole compose
   stack — no orphan server process possible by construction. `--keep-up`
   leaves it running and prints the `logs` / `down` commands instead.

## Key facts

- **Isolated database.** The backend runs with `NODE_ENV=test`, which selects
  the `timecalendar_test` database (`server/src/config/environments/test.ts`).
  The harness never touches a developer's `timecalendar` (dev) data, even
  though `db:init` drops the database it runs against.
- **`PORT=3005` is set by the compose overlay.** The `test` environment does
  not set `PORT`, and it defaults to `80`. The e2e overlay
  (`server/docker-compose.e2e.yml`) sets `PORT=3005` on the server service.
- **`SMTP_URL` is set by the compose overlay.** `MailerService` builds a
  `nodemailer` transport in its constructor, and the `test` environment leaves
  `SMTP_URL` unset (an empty string makes `createTransport` throw at boot). The
  overlay sets a dummy `SMTP_URL=smtp://localhost:1025`; nothing in the E2E
  path sends mail.
- **Reaching Postgres/Redis.** The `test` env defaults
  (`DATABASE_URL=…@localhost:37291/…`, `REDIS_URL=…127.0.0.1:37292`) target the
  *host* ports. Inside the compose network the overlay overrides them to the
  service names (`postgres:5432`, `redis:6379`).
- **Dummy Firebase key (generated, never committed).**
  `server/src/config/firebase.ts` reads `config/serviceAccountKey.json` at
  import time and `FirebaseModule` is in `AppModule`, so the backend cannot
  boot without that file. The shared lifecycle `ci/e2e-server.sh` **generates**
  a well-formed **dummy** key at `server/config/serviceAccountKey.json` (via
  `ci/generate-dummy-firebase-key.sh`) before bringing the server up — it mints
  a fresh throwaway RSA private key with `openssl` and assembles the JSON
  (placeholder project/email) around it — only when the file is absent, so a
  developer's real key is left untouched. The overlay mounts it read-only into
  the container. `firebase-admin` only validates the
  JSON shape at init; the schools endpoint never calls Firebase. The key is
  **not committed**: GitHub Push Protection rejects any service-account-shaped
  JSON as a credential — and rejects a PEM `private_key` literal embedded in the
  script too — so the key is generated fresh per run and no credential material
  lives in the repo. `server/.gitignore` keeps `server/config/` ignored, so the
  generated file stays untracked.
- **Backend URL wiring.** The app reads `MAIN_API_URL` via
  `String.fromEnvironment` — a *compile-time* value — so it must be passed
  with `--dart-define`, not an env var. The host defaults to `10.0.2.2` (the
  host loopback as seen from an Android emulator); override it for a physical
  device with the `E2E_API_HOST` env var.
- **Deterministic calendar data without an external call.**
  `server/src/scripts/seed-e2e-calendar.ts` seeds a `Calendar` +
  `CalendarContent` under the constant token `e2e-smoke-calendar`, with events
  dated **relative to the seed run** so they fall in the current-week view. It
  is a guarded seed step rather than a YAML fixture because `typeorm-fixtures-cli`
  does not evaluate its `<( )>` expressions inside a JSON column. The calendar's
  `lastUpdatedAt` is set to "now", so `POST /calendars/sync` returns the seeded
  events without re-fetching any external iCal URL. `E2E_CALENDAR_ID` /
  `E2E_CALENDAR_TOKEN` there are the source of truth for the constants
  `calendar_flow_test.dart` mirrors.

## The `pumpAndSettle` spinner gotcha — template for new flows

`SchoolList` shows a `CircularProgressIndicator` while `GET /schools` is in
flight. `tester.pumpAndSettle()` never settles against a running progress
animation and **times out**. Any flow that waits on a live request must instead
use the `pumpUntilFound` helper from `test_utils.dart`, which pumps a fixed
step in a bounded loop until the expected widget appears:

```dart
final target = find.text('My Gaming Academia');
await pumpUntilFound(tester, target);
expect(target, findsOneWidget);
```

## Per-file process isolation

`waitAppInitialized` calls `app.main()`, and `main()` calls
`Firebase.initializeApp`; running that a second time in the **same process**
throws `[core/duplicate-app]`. `main.dart` installs a
`PlatformDispatcher.onError` handler that swallows errors, so that throw never
surfaces as a failure — a second `testWidgets` in one process simply **hangs**
until a timeout fires.

So each flow lives in its own `integration_test/*_flow_test.dart` entrypoint
file, and `run_e2e.sh` runs each file as a **separate `flutter test`
invocation** — a fresh OS process, so `Firebase.initializeApp` runs exactly
once per file. This is zero production code: no `main.dart` change, no
process-wide singleton resets. It is slower (one device session per file) but
the suite is small and this is a smoke suite. Adding a flow is therefore just
adding a file — no harness change.

## How to add a flow

1. Add `integration_test/<name>_flow_test.dart`. `run_e2e.sh` globs
   `*_flow_test.dart`, so the new file is picked up automatically.
2. Boot the app with `waitAppInitialized(tester)` after setting up local
   state:
   - `resetLocalAppState()` — clears SharedPreferences and the Sembast store
     so the run never inherits previous state. Call it first.
   - To boot into onboarding, leave the local DB empty.
   - To boot into `TabsScreen`, call `seedUserCalendar(id: ..., token: ...)`
     **before** `waitAppInitialized` — the splash controller routes to
     `TabsScreen` when the local DB has ≥1 calendar. The `id` must match the
     backend `Calendar.id` (`eventsForViewProvider` filters synced events by
     `userCalendarId`); for the seeded smoke calendar use the values from
     `server/src/scripts/seed-e2e-calendar.ts`.
   These helpers live in `app/lib/modules/shared/test_utils/test_utils.dart`
   — test-support code that ships in `lib/` so `integration_test/` can import
   it.
3. Use the bounded-pump pattern (below) for every live backend round-trip.
4. Assert on the deterministic data seeded by `db:init` — the two seeded
   schools (`My Gaming Academia`, `Université Gustave Eiffel`) and the
   `e2e-smoke-calendar` events (`Cours E2E Test` / `Salle E2E`, …).
5. Keep a per-test `timeout:` so a hang fails fast instead of stalling the job.

## Out of scope

This is a *nominal* smoke suite. The following are intentionally **not**
covered:

- **Completing the add-school assistant.** `/assistant` is a WebView that loads
  the *web* app and finishes over a JS bridge; driving a remote web embed from
  an `integration_test` is neither nominal nor flake-free. The add-school flow
  only asserts the native routing advances.
- **Auth / intranet-connected schools, QR-code import, personal events.**
- **Error-path / offline coverage** — only the happy path.
- **Web/Linux** — the unmodified app runs on Android only (see below).

## Why Android only

`app/lib/main.dart` imports `dart:io` (absent on web) and calls
`Firebase.initializeApp`. `firebase_crashlytics` has no web or Linux-desktop
support. Running the app on web or Linux would require conditional imports and
plugin shims in `lib/` — production-code debt this cycle does not take on.
Android is the only platform the unmodified app runs on.

## CI is the canonical green run

The dev host has no `/dev/kvm` and no Android SDK, so it cannot reliably boot
an emulator — `run_e2e.sh` fails fast at the device-resolution step (step 2)
there. Its correctness (backend boot, seeding, `--dart-define` wiring,
teardown) is still fully verifiable locally: the server stack (step 1) comes up
seeded and teardown leaves nothing running.

The **canonical green run is the `test-e2e` GitHub Actions job** in
`.github/workflows/ci-flutter.yml`, which runs `run_e2e.sh` inside
`reactivecircus/android-emulator-runner` on a hardware-accelerated emulator.
That workflow runs on `main`/`production` pushes touching `app/**` only (R-5
bounded maintenance), not on every push.
