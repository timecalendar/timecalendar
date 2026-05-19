## Why

A1 (`flutter-test-foundation`, TIM-4) gave the app a unit/widget test harness;
A3 (`nominal-core-module-tests`, TIM-6) is filling in module coverage. Neither
exercises the **app ↔ backend contract**: a breaking change to a NestJS
endpoint or its DTO ships silently because nothing runs the Flutter app against
a real server. This change (TIM-5 / A2) adds an end-to-end smoke harness — one
command that boots the NestJS backend + Postgres, seeds known data, and runs a
Flutter `integration_test` green against it. It is the foundation A4 (TIM-7)
builds more flows on, so the emphasis is a *reliable, documented* harness over
test breadth: exactly **one** happy-path test.

## What Changes

Add an end-to-end smoke-test harness. No production (`lib/` or `server/src/`)
behaviour changes — only test/orchestration/CI assets. The harness generates a
dummy service-account key at runtime so the backend boots without a real
Firebase credential; the key is never committed.

- **Orchestrating command** — `app/integration_test/run_e2e.sh`: brings up
  Postgres + Redis via `server/docker-compose.yml`, runs migrations + seeds
  fixtures into the isolated `timecalendar_test` database, starts the NestJS
  server, waits until `GET /schools` is reachable, runs the Flutter
  `integration_test` with `--dart-define` pointed at the local backend, reports
  pass/fail, and tears everything down (even on failure).
- **Deterministic seed state** — the harness uses `npm run db:init` (drop +
  migrate + seed) so every run starts from the existing `School` fixtures
  (`mygamingacademia`, `univeiffel`). The two seeded schools are the known
  state the happy-path test asserts on.
- **Happy-path integration test** — one new `testWidgets` in
  `app/integration_test/app_test.dart`: launch the app, reach the school-
  selection screen, and assert the two seeded schools render — proving a real
  `GET /schools` round-trip against the local backend.
- **Backend bootability** — `config/firebase.ts` reads `serviceAccountKey.json`
  at import time, so the full Nest app cannot start without it. `run_e2e.sh`
  generates a well-formed **dummy** key at `server/config/serviceAccountKey.json`
  at runtime (never committed — GitHub Push Protection rejects any
  service-account-shaped JSON; `server/config/` stays gitignored) so the server
  boots; the schools endpoint never calls Firebase.
- **CI** — a new `test-e2e` job in `.github/workflows/build.yaml` that runs the
  harness on a hardware-accelerated Android emulator. CI is the canonical
  green run (see design.md — the local dev host is headless and has no KVM).
- **Documentation** — `app/integration_test/README.md` so A4/TIM-7 can add
  flows.

Non-goals: multiple E2E flows (A4 — TIM-7); auth/calendar-sync flows;
production code changes or refactors; test-isolation across multiple E2E tests
(A4 owns it — this change ships exactly one test); replacing the A1 unit/widget
suite.

## Capabilities

### New Capabilities
- `e2e-smoke-harness`: a single-command end-to-end smoke harness — boot
  backend + DB, seed deterministic state, run one Flutter `integration_test`
  against the live backend, in CI and (best-effort) locally.

### Modified Capabilities
<!-- None — the A1 `flutter-test-harness` is consumed unchanged. -->

## Impact

- `app/integration_test/run_e2e.sh` — new orchestrating script.
- `app/integration_test/app_test.dart` — one new happy-path `testWidgets`.
- `app/integration_test/README.md` — new harness documentation.
- `server/config/serviceAccountKey.json` — dummy Firebase key generated at
  runtime by `run_e2e.sh`; not committed (stays gitignored).
- `.github/workflows/build.yaml` — new `test-e2e` job.
- No `app/lib/`, `server/src/`, `pubspec.yaml` or DTO changes. The harness runs
  the backend against the `timecalendar_test` database, so it never touches a
  developer's `timecalendar` (dev) data.
