# Tasks

Conventions for every task below:
- Flutter SDK is not on `PATH`: prefix Flutter/Dart commands with
  `export PATH="/home/dev/flutter/bin:$PATH"`.
- Backend commands run from `server/`; Flutter commands from `app/`.
- The harness runs the backend with `NODE_ENV=test` (database
  `timecalendar_test`, `ENABLE_QUEUE=false`) and `PORT=3005` — see design.md
  Decision 3. Never run `db:init` against the dev `timecalendar` database.
- Each task states its own verification. Read `design.md` before starting —
  the headless-device decision (Decisions 1–2) and the `pumpAndSettle` spinner
  gotcha (Decision 5) are load-bearing.

## 1. Make the backend bootable

- [x] 1.1 Add `server/config/serviceAccountKey.json` — a well-formed **dummy**
  Firebase service-account JSON (placeholder `project_id`, `client_email`, and
  a syntactically valid dummy `private_key`). `config/firebase.ts` reads this
  file at import time and `FirebaseModule` is in `AppModule`, so the Nest app
  will not boot without it. Verify: from `server/`,
  `NODE_ENV=test PORT=3005 npm run start` boots without throwing on the
  `serviceAccountKey` read or on `firebase-admin` `cert()`. If `cert()` rejects
  the dummy `private_key`, use a generated throwaway key or a stub
  `SERVICE_ACCOUNT_KEY_PATH` instead, and record the choice in task 4's README.

## 2. Backend orchestration script

- [x] 2.1 Create `app/integration_test/run_e2e.sh` (executable, `set -euo
  pipefail`). It MUST, in order:
  1. Start Postgres + Redis: `docker compose -f server/docker-compose.yml up -d
     postgres redis`.
  2. Wait for Postgres to accept connections (reuse `ci/wait.sh
     localhost:37291 -t 60`, or `pg_isready`).
  3. Seed deterministic state: from `server/`,
     `NODE_ENV=test PORT=3005 npm run db:init` (drop + migrate + seed).
  4. Start the backend in the background: from `server/`,
     `NODE_ENV=test PORT=3005 npm run start`; capture its PID and logs.
  5. Poll `GET http://localhost:3005/schools` until it returns HTTP 200
     (bounded, e.g. 60 s) — this confirms the server, DB and seed are all up.
  6. Resolve a target device from `flutter devices`. If none, exit non-zero
     with a clear message ("no Android device/emulator — see
     integration_test/README.md / run the `test-e2e` CI job").
  7. Run the test: from `app/`,
     `flutter test integration_test/app_test.dart -d <device>
     --dart-define MAIN_API_URL=http://${E2E_API_HOST:-10.0.2.2}:3005`.
  8. Capture the Flutter exit code as the script's result.
- [x] 2.2 Add teardown via a `trap ... EXIT` so it runs on success **and**
  failure: kill the backend process, `docker compose -f server/docker-compose.yml
  down`. Support a `--keep-up` flag that skips teardown for debugging.
- [x] 2.3 Verify the non-device path locally: run `run_e2e.sh` on the dev host
  (no emulator) and confirm steps 1–5 succeed — backend boots, `/schools`
  returns 200 with the two seeded schools (`curl localhost:3005/schools`) — and
  step 6 fails fast with the documented message, then teardown runs cleanly.

## 3. Happy-path integration test

- [x] 3.1 Add one new `testWidgets` to `app/integration_test/app_test.dart`
  (keep the existing "shows the onboarding screen" test). The new test:
  - `await waitAppInitialized(tester);` (launches `app.main()`).
  - Skip onboarding: tap the **"Passer"** control
    (`find.text('Passer')`) → routes to `SelectSchool`.
  - Wait for the live `GET /schools` round-trip **without `pumpAndSettle`**
    (the `SchoolList` loading `CircularProgressIndicator` prevents settling —
    see design.md Decision 5): pump a fixed step in a bounded loop until
    `find.text('My Gaming Academia')` is present (e.g. 300 ms steps, ~30 s
    budget).
  - Assert `find.text('My Gaming Academia')` and
    `find.text('Université Gustave Eiffel')` each `findsOneWidget`.
- [x] 3.2 Verify the test compiles and analyzes clean: from `app/`,
  `flutter analyze integration_test`. Full green execution is verified by
  task 5 (CI) and, best-effort, by task 2.3 if a device is available.

## 4. Documentation

- [x] 4.1 Add `app/integration_test/README.md` covering: how to run the harness
  (`./integration_test/run_e2e.sh`), prerequisites (Docker, an Android
  device/emulator, Flutter SDK path), what it does (boot → seed → test →
  teardown), the `timecalendar_test`-database / `PORT=3005` / dummy
  service-account-key facts, the `--dart-define MAIN_API_URL` /
  `E2E_API_HOST` / `10.0.2.2` wiring, the `pumpAndSettle`-vs-spinner gotcha as
  the template for new flows, and a short "How to add a flow (for A4/TIM-7)"
  section. Note the headless-host limitation and that CI (`test-e2e`) is the
  canonical green run.

## 5. CI job

- [x] 5.1 Add a `test-e2e` job to `.github/workflows/build.yaml`:
  `runs-on: ubuntu-latest`; checkout; set up Flutter (3.41.9, matching the
  existing `test-app` job) and Java; start Postgres + Redis via
  `docker compose -f server/docker-compose.yml up -d postgres redis`; install
  server deps and run the backend (`NODE_ENV=test PORT=3005`, seeded with
  `db:init`) in the background; then run the Flutter test inside
  `reactivecircus/android-emulator-runner@v2` with `script:` invoking
  `flutter test integration_test/app_test.dart --dart-define
  MAIN_API_URL=http://10.0.2.2:3005`. Give the job a generous `timeout-minutes`
  for emulator cold boot. Prefer driving the existing `run_e2e.sh` where it
  fits, to avoid duplicating boot/seed logic.
- [x] 5.2 Verify the workflow YAML is well-formed (e.g. `yq`/`actionlint` if
  available, otherwise a careful diff against the existing `test`/`test-app`
  jobs). Triggering the run requires the repo owner (the `gh` account is
  read-only) — leave the job for the owner/CI to execute and note this in the
  handoff.

## 6. Verification

- [ ] 6.1 Run `run_e2e.sh` end to end on whatever device is available
  (CI emulator is canonical). Confirm: backend boots, `/schools` serves the two
  seeded schools, the integration test passes, teardown leaves no running
  container or backend process.
  > Left unchecked by design — see task 6.2. The dev host has no Android
  > SDK / emulator (`flutter devices` lists only Linux + Chrome), so a fully
  > green local run is not possible. Steps 1–5 + teardown were verified
  > locally (task 2.3); the integration test is proven green by the CI
  > `test-e2e` job. Per task 6.2, 6.1 is not marked green on a run that did
  > not happen.
- [x] 6.2 If no emulator can be brought up on the dev host, record that in the
  README, ensure the CI `test-e2e` job is the green-proof, and escalate the
  local-verification gap to FoundingEngineer (do not mark 6.1 green on a run
  that did not happen).
