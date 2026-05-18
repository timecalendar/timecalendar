## Context

TIM-5 / A2 asks for a single command that boots the NestJS backend + Postgres
and runs a Flutter `integration_test` green against it — one reliable
happy-path test, documented so A4 (TIM-7) can add more. The investigation in
the issue was confirmed against the code; this document records the decisions,
especially the riskiest one (how the test runs on a headless host).

Environment facts (verified):
- `app/` declares **only `android` and `ios`** platforms.
- `app/lib/main.dart` imports `dart:io` and calls
  `Firebase.initializeApp(...)`; `firebase_crashlytics` / `firebase_messaging`
  are in `pubspec.yaml`.
- The dev host has Docker + docker-compose, `google-chrome`, Flutter 3.41.9 at
  `/home/dev/flutter` (not on `PATH`) — but **no Android SDK, no `/dev/kvm`**.
- Backend config (`server/src/config/constants.ts`): `NODE_ENV=test` selects
  `testEnvVariables` → database `timecalendar_test`, `ENABLE_QUEUE=false`,
  Postgres `localhost:37291`; `PORT` defaults to `80` unless set.
- `config/firebase.ts` does `readFileSync(serviceAccountKey.json)` **at import
  time**, and `FirebaseModule` is in `AppModule` → the Nest app will not boot
  without that file. `server/config/` currently has no key.
- The app reaches the backend via `dioProvider`, whose `baseUrl` is
  `environmentProvider.mainApiUrl` = `String.fromEnvironment('MAIN_API_URL')`
  — a **compile-time** value, so it must be passed with `--dart-define`.

## Goals / Non-Goals

**Goals:**
- One command boots backend + DB, seeds known state, runs one Flutter
  `integration_test`, reports pass/fail, tears down.
- The harness is deterministic and re-runnable.
- It is documented well enough that A4 adds flows without re-deriving any of
  this.

**Non-Goals:**
- More than one E2E flow; cross-test isolation (A4 — TIM-7).
- Production code changes; making the app web/desktop-capable.
- A coverage target.

## Decision 1 — Target platform: Android (web and Linux desktop are rejected)

The issue offered three options for running the test on a headless host. The
choice is constrained by what the app *can* run on:

- **Flutter web (option b) — rejected.** `app/lib/main.dart` imports `dart:io`,
  which does not exist on web, so the app does not even compile for web.
  Beyond that, `firebase_crashlytics` has no web support and several plugins
  (`mobile_scanner`, `permission_handler`, `flutter_local_notifications`) are
  mobile-only. Making the app web-runnable means conditional imports, a web
  Firebase config and plugin shims in `lib/` — exactly the production-code
  debt this cycle forbids.
- **Linux desktop — rejected** for the same reason: Firebase has no
  Linux-desktop support, so `Firebase.initializeApp` fails at startup.
- **Android emulator (option a)** is therefore the only platform on which the
  *unmodified* app runs. The existing `integration_test/app_test.dart` already
  assumes a real device (it calls `app.main()`, which needs the native
  Firebase plugin).

**Decision: Android is the target platform.** The integration test runs on an
Android emulator.

## Decision 2 — Canonical execution is CI; the local host is best-effort

The dev host has no `/dev/kvm` and no Android SDK. An x86_64 emulator can still
run there under pure-software (TCG) emulation, but cold boot takes many minutes
and is flaky — not a "reliable" harness.

**Decision: the canonical, reliably-green run is a GitHub Actions job**
(`test-e2e`) using `reactivecircus/android-emulator-runner`, which gets a
KVM-accelerated emulator on GitHub-hosted runners. This is option (c) from the
issue — "ship a CI-targeted runner" — folded together with option (a).

`run_e2e.sh` is written **device-agnostic**: it runs against whatever Android
device/emulator `flutter devices` reports. So the same script is the harness
in CI and locally. Locally the Applier may attach a device or boot a
software emulator best-effort; if no device is available the script fails fast
with a clear message pointing at the CI job and the README. The script's
correctness — backend boot, seeding, dart-define wiring, teardown — is fully
verifiable locally regardless of whether an emulator is present.

> Applier note: deliverable #3 ("a test that passes against the local
> backend") is proven green by the CI job. Attempt a local emulator run; if the
> SDK/emulator cannot be brought up in this environment, document that in the
> README and escalate the local-verification gap to FoundingEngineer rather
> than reporting #3 as locally verified when it was not.

## Decision 3 — Backend runs in the `test` environment

`run_e2e.sh` starts the backend with `NODE_ENV=test`:
- It uses the **isolated `timecalendar_test` database**, so the harness never
  drops a developer's `timecalendar` (dev) data when it runs `db:init`.
- `ENABLE_QUEUE=false`, removing a hard Redis dependency.
- `PORT` is not set by `testEnvVariables` and defaults to `80`, so the harness
  **must pass `PORT=3005` explicitly**. `3005` keeps parity with the dev
  default and with `10.0.2.2:3005` from the emulator.

Redis is still started via docker-compose anyway (it is cheap and `RedisModule`
is in `AppModule`); this removes a boot-order risk for a negligible cost.

Seeding uses `npm run db:init` (= `seed-database.ts --drop` → drop database,
run all migrations, load every `**/fixtures/*.yml`). That yields deterministic
state every run. The existing fixtures seed two schools — `My Gaming Academia`
and `Université Gustave Eiffel` — which become the known state the test
asserts on. `npm run db:init` (drop) is used rather than `db:seed` (insert) so
re-runs do not accumulate or collide on the unique `School.code`.

## Decision 4 — Make the backend bootable: generate the dummy key at runtime

`config/firebase.ts` runs `readFileSync(serviceAccountKey.json)` at import and
`FirebaseModule` is in `AppModule`, so `npm run start` throws at startup if the
file is missing — and `server/config/` has no key. `firebase-admin`'s
`credential.cert(...)` only validates the JSON *shape* at init time (it needs
`project_id`, `private_key`, `client_email`); it makes no network call until an
API method runs. The schools endpoint never calls Firebase.

**Decision: `run_e2e.sh` generates a well-formed dummy
`server/config/serviceAccountKey.json` at runtime; it is never committed.**
The JSON has a placeholder project id / client email and a syntactically valid
dummy RSA `private_key` — enough for `cert()` to accept the shape and the
backend to boot; nothing in the E2E path exercises Firebase.

It is generated, not committed, because **GitHub Push Protection rejects any
service-account-shaped JSON** (`type: service_account` + a PEM `private_key`) as
a credential, regardless of the placeholder project id — so committing the file
is a dead end — and so is embedding a PEM `private_key` literal in `run_e2e.sh`
itself, which the scanner flags just the same. So `run_e2e.sh` mints a **fresh
throwaway RSA private key with `openssl`** on every run and assembles the dummy
JSON around it (only when the file is absent, so a developer's real key is left
untouched): no credential material lives in any committed file.
`server/.gitignore` keeps `server/config/` ignored so the generated file stays
untracked. The CI `test-e2e` job runs `run_e2e.sh`, so it is covered with no
extra step.

## Decision 5 — The happy-path flow

Flow exercised by the one test:

1. `app.main()` launches the app on a fresh emulator (no stored settings) →
   `SplashScreen` → first-launch `OnboardingScreen` (first page text
   `"Consultez votre agenda"` — what the current `app_test.dart` already
   asserts).
2. Tap **"Passer"** → `OnboardingScreen.closeOnboarding` does
   `pushNamedAndRemoveUntil(SelectSchool.routeName)`.
3. `SelectSchool` builds `SchoolList`, whose `schoolSelectionControllerProvider`
   calls `client.schoolsApi().findSchools()` → real `GET /schools` on the local
   backend.
4. Assert both seeded school names render
   (`find.text('My Gaming Academia')`, `find.text('Université Gustave Eiffel')`).

This is a genuine backend round-trip: a broken `/schools` endpoint, DTO, or the
generated `timecalendar_api` client fails the test.

**Gotcha — do not `pumpAndSettle` through the loading spinner.** `SchoolList`
shows a `CircularProgressIndicator` while the request is in flight;
`pumpAndSettle` never settles against a running progress animation and will
time out. The test must instead pump in a bounded loop until the school text
appears (pump a fixed step, e.g. 300 ms, up to a ~30 s budget, then assert).
This pattern is documented in the README as the template A4 reuses.

**Single test by design.** `SettingsProvider` and `SimpleDatabase` are
process-wide singletons; a second `testWidgets` calling `app.main()` would not
see a fresh onboarding state. This change ships exactly one test, so ordering
is a non-issue; A4 (TIM-7) owns multi-test isolation (e.g. resetting
`SharedPreferences`/navigating directly) when it adds flows.

## Decision 6 — `flutter test`, not `flutter drive`

With the `integration_test` package and a target device,
`flutter test integration_test/app_test.dart -d <device>` reports pass/fail
directly and needs no `test_driver/` file (that is only required for
`flutter drive` or screenshot capture). The harness uses `flutter test`.

The backend URL is passed as `--dart-define MAIN_API_URL=http://10.0.2.2:3005`
(`10.0.2.2` is the host loopback as seen from an Android emulator). For a
non-emulator device the host is configurable via an `E2E_API_HOST` env var,
defaulting to `10.0.2.2`.

## Risks / Trade-offs

- **Local host cannot reliably run the emulator** (no KVM/SDK). Mitigated by
  making CI canonical and the script device-agnostic — see Decision 2.
- **Dummy Firebase key.** Committing `serviceAccountKey.json` (a placeholder,
  non-secret) is unusual; it is the pragmatic way to keep the backend bootable
  for the harness and CI without secrets. Documented in the README. If repo
  policy forbids committing it, the fallback is a CI-generated key — flag to
  FoundingEngineer if so.
- **`pumpAndSettle` spinner trap** — addressed explicitly in Decision 5 and the
  README so A4 does not re-hit it.
- **Cold-boot time.** Even KVM-accelerated CI emulator boot is minutes; the
  `test-e2e` job is allowed a generous timeout and is not a required gate for
  merge unless FoundingEngineer decides otherwise.

## Migration Plan

Purely additive: new script, one new test, new README, new CI job, one
committed dummy key file. No `lib/`, `server/src/`, `pubspec.yaml` or DTO
changes. Reverting deletes these assets with no other effect.

## Open Questions

- Should `test-e2e` be a **required** PR check, or informational until A4
  broadens coverage? Recommend informational for now; FoundingEngineer to
  confirm. Not blocking — the Applier ships the job either way.
- Whether committing the dummy `serviceAccountKey.json` is acceptable under
  repo policy (see Risks). Default: commit it; the Applier escalates if policy
  says otherwise.
