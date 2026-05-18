# End-to-end smoke harness

`run_e2e.sh` is a single command that boots the **real NestJS backend +
Postgres**, seeds known data, runs the Flutter `integration_test` against the
live backend, and tears everything down. It exists so a breaking change to a
backend endpoint, its DTO, or the generated `timecalendar_api` client fails a
test instead of shipping silently.

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
- `curl` and `python3` (the script uses them to poll the backend and to pick
  the Android device out of `flutter devices --machine`).

Server (`npm`) and app (`flutter pub get`) dependencies are installed by the
script if missing.

## What it does

1. `docker compose -f server/docker-compose.yml up -d postgres redis`.
2. Waits for Postgres to accept connections (`ci/wait.sh`).
3. Seeds the database: `NODE_ENV=test PORT=3005 npm run db:init` — drop,
   migrate, then load every `**/fixtures/*.yml`.
4. Starts the backend: `NODE_ENV=test PORT=3005 npm run start`.
5. Polls `GET http://localhost:3005/schools` until it returns HTTP 200.
6. Resolves an Android device from `flutter devices`; exits fast with a clear
   message if none is connected.
7. Runs `flutter test integration_test/app_test.dart` with
   `--dart-define MAIN_API_URL=...` pointing at the local backend.
8. Tears down (`trap … EXIT`): kills the backend process group and
   `docker compose down`.

## Key facts

- **Isolated database.** The backend runs with `NODE_ENV=test`, which selects
  the `timecalendar_test` database (`server/src/config/environments/test.ts`).
  The harness never touches a developer's `timecalendar` (dev) data, even
  though `db:init` drops the database it runs against.
- **`PORT=3005` is passed explicitly.** The `test` environment does not set
  `PORT`, and it defaults to `80`. The harness always passes `PORT=3005`.
- **`SMTP_URL` is passed explicitly.** `MailerService` builds a `nodemailer`
  transport in its constructor, and the `test` environment leaves `SMTP_URL`
  unset (an empty string makes `createTransport` throw at boot). The harness
  passes a dummy `SMTP_URL=smtp://localhost:1025`; nothing in the E2E path
  sends mail.
- **Dummy Firebase key (generated, never committed).**
  `server/src/config/firebase.ts` reads `config/serviceAccountKey.json` at
  import time and `FirebaseModule` is in `AppModule`, so the backend cannot
  boot without that file. `run_e2e.sh` **generates** a well-formed **dummy**
  key at `server/config/serviceAccountKey.json` before starting the backend —
  it mints a fresh throwaway RSA private key with `openssl` and assembles the
  JSON (placeholder project/email) around it — only when the file is absent, so
  a developer's real key is left untouched. `firebase-admin` only validates the
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

## The `pumpAndSettle` spinner gotcha — template for new flows

`SchoolList` shows a `CircularProgressIndicator` while `GET /schools` is in
flight. `tester.pumpAndSettle()` never settles against a running progress
animation and **times out**. Any flow that waits on a live request must pump a
fixed step in a bounded loop until the expected widget appears, instead of
`pumpAndSettle`:

```dart
final target = find.text('My Gaming Academia');
for (var i = 0; i < 100; i++) {
  await tester.pump(const Duration(milliseconds: 300));
  if (target.evaluate().isNotEmpty) break;
}
expect(target, findsOneWidget);
```

## How to add a flow (for A4 / TIM-7)

- Use the bounded-pump pattern above for every live backend round-trip.
- Assert on the deterministic fixture data seeded by `db:init` (e.g. the two
  seeded schools, `My Gaming Academia` and `Université Gustave Eiffel`).
- **Test isolation is not yet handled — and a second `testWidgets` is not a
  drop-in.** `app.main()` boots process-wide singletons (`SettingsProvider`,
  `SimpleDatabase`, the Firebase app). A second `testWidgets` that calls
  `app.main()` again re-enters that init against already-open singletons and
  never reaches a fresh, settled state — the run hangs. That is why this
  harness ships **exactly one `testWidgets`** that asserts the onboarding
  screen and the seeded-schools round-trip in a single launch. A4 owns proper
  cross-test isolation (resetting `SharedPreferences`, re-opening
  `SimpleDatabase`, or navigating directly without a second `app.main()`)
  before adding more flows.

## Why Android only

`app/lib/main.dart` imports `dart:io` (absent on web) and calls
`Firebase.initializeApp`. `firebase_crashlytics` has no web or Linux-desktop
support. Running the app on web or Linux would require conditional imports and
plugin shims in `lib/` — production-code debt this cycle does not take on.
Android is the only platform the unmodified app runs on.

## CI is the canonical green run

The dev host has no `/dev/kvm` and no Android SDK, so it cannot reliably boot
an emulator — `run_e2e.sh` fails fast at step 6 there. Its correctness
(backend boot, seeding, `--dart-define` wiring, teardown) is still fully
verifiable locally: steps 1–5 succeed and teardown leaves nothing running.

The **canonical green run is the `test-e2e` GitHub Actions job** in
`.github/workflows/build.yaml`, which runs `run_e2e.sh` inside
`reactivecircus/android-emulator-runner` on a hardware-accelerated emulator.
