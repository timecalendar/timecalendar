# Mobile E2E (Maestro)

The native daily/manual smoke pack contains exactly three cross-platform user
journeys, executed lexically from `mobile/.maestro/*.yaml`:

1. `01-fresh-user-import.yaml` — a fresh student selects the live seeded school,
   enters a programme, follows Connect and URL import, imports the harness-owned
   iCalendar URL through the real backend, then opens the synced event details.
2. `02-personal-event.yaml` — create, edit, cold-reopen, and delete a personal
   event from the shipped Calendar/Agenda surface through the real SQLite store.
3. `03-calendar-visibility.yaml` — import the seeded subscription, hide it,
   cold-reopen Agenda to prove its schedule is absent, restore it, and cold-reopen
   again to prove the schedule returns.

Reusable YAML belongs under `.maestro/helpers/`. Helpers run only through
`runFlow`; the harness never discovers them as business journeys. The exact
three-file inventory is a baseline-CI invariant in both
`maestro-selectors.test.ts` and `test_run_e2e.sh`.

This pack is a release-health smoke signal, not the complete release acceptance
suite. Phase 10 release candidates still receive broader human exploratory
acceptance for parity areas such as notifications, assistant behavior,
Flutter-to-React-Native migration, settings, and detailed UI behavior.

## Deterministic data

`ci/e2e-server.sh` boots and seeds NestJS, Postgres, and Redis once for the run.
The fresh-import journey submits
`http://127.0.0.1:3005/__e2e/ical/import.ics`. That endpoint is registered only
in the server test/E2E module graph, excluded from OpenAPI, and returns a
date-neutral event on the next UTC day. The backend fetches its own loopback URL,
so the journey needs no university endpoint and no emulator-specific URL for the
iCalendar source.

The visibility journey uses the existing `e2e-smoke-calendar` token through the
nested import helper. Its target and control events are both anchored on the next
UTC day, keeping the negative assertion meaningful if a job crosses midnight.

## Prerequisites and local command

- Install a release-config `development` variant on one booted simulator or
  emulator. The wrapper does not build or install the app.
- Install Maestro 2.8.0 and a JDK.
- Use Docker for the default lifecycle. `--native` is the Docker-less macOS-CI
  seam where the caller provisions Postgres and Redis.
- Build with the platform-local backend URL:
  `http://10.0.2.2:3005` for Android or `http://localhost:3005` for iOS, with
  `APP_VARIANT=development` and
  `BACKEND_ENVIRONMENT_CAPABILITY=development`.

From `mobile/`:

```bash
./e2e/run_e2e.sh
./e2e/run_e2e.sh --keep-up
./e2e/run_e2e.sh --native --startup-attempts 4
```

The wrapper boots the shared server lifecycle once, runs each top-level YAML in
a fresh Maestro process, stops at the first terminal failure, and tears the stack
down once. `--keep-up` retains the stack and prints the log/teardown commands.

## Retry and static integrity

ADR 038 remains binding. Normal and Android runs attempt each flow once; iOS CI
may request up to four attempts. Retry classification is structural and reads
Maestro's per-flow `commands.json`. Assertion evidence, an independent failed
command, an evaluated assertion, or an interaction in the final restart epoch is
terminal. A missing record or a startup-only final epoch is retryable; malformed
records fail closed. Every retry starts the whole top-level journey in a new
Maestro process.

Baseline CI stays the primary feedback loop:

- `maestro-selectors.test.ts` recursively scans journeys and helpers, resolves
  every `id:` regex against shipped `testID`s, rejects bare `back` and
  `hideKeyboard`, validates title selectors across Android/iOS accessibility
  projections, and pins the three nominal journey sequences including positive
  anchors before negative assertions.
- `test_run_e2e.sh` proves the exact inventory, lexical process-per-flow
  execution, helper exclusion, terminal stop, teardown, `--keep-up`, and the
  mutation-backed retry-classifier branches without allocating a device.
- `test_ci_mobile_e2e.sh` proves the daily/manual workflow contract and both
  platform jobs.

## Removed-flow coverage map

The reduction was audited against deterministic lower-level coverage. No valuable
uncovered behavior required a new mobile test; the only missing seam was the real
server-backed import fixture and create-path integration proof added with this
change.

| Removed native coverage                                                                   | Retained cheaper proof                                                                                                                                            |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activity pagination, unread watermark, tie ordering, current/cancelled routing            | Server `calendar-log` controller/repository/service suites; mobile `activity/data` pagination, restart, ownership, unread, and `activity-screen` component suites |
| Settings, About, changelog, appearance, notification, and timezone destinations           | `settings-screen`, `about-screen`, changelog, appearance, notification-settings, and timezone-settings component suites                                           |
| Backend environment switching and recovery                                                | `environment/data` orchestrator/session/store/switch suites and `environment-runtime-gate` / settings-control component suites                                    |
| Feedback reachability, validation, remembered email, and submit failure                   | `feedback/data`, `feedback/form`, and `feedback-screen` suites                                                                                                    |
| Shared-calendar rename and convergence                                                    | Server calendar rename/controller tests plus mobile `user-calendars/rename`, sync convergence, and rename-dialog suites                                           |
| Checklist CRUD, ordering, restart, and progress rendering                                 | `event-checklists/data` repository/restart/hooks/progress suites and checklist/progress renderer component suites                                                 |
| Per-event hide/un-hide                                                                    | `hidden-events` store/restart/hooks/component suites and calendar event-filter tests                                                                              |
| Standalone Home and Calendar reachability/rendering variants                              | `home-screen`, `calendar-screen`, agenda/timeline renderer, routing, and calendar data tests                                                                      |
| iCalendar inline validation, failure/retry/report, unlisted institution, and route wiring | `validate-url`, `ical-url-screen`, programme/connect/manual-import, and school-picker component/data suites                                                       |
| Harness recovery fixtures and UI-polish variants                                          | Device-free classifier/harness mutation fixtures, recursive selector integrity, and owning component suites                                                       |

Do not mechanically recreate a removed assertion. Add lower-level coverage only
when a valuable behavior is genuinely absent, and prefer replacing a smoke
journey over growing the daily pack. More than five top-level business journeys
requires a new board decision (ADR 057).

## CI evidence

The native workflow is scheduled daily when relevant inputs changed and may be
manually dispatched with an explicit ref or SHA. Preparation resolves one
immutable commit used by the server image and both platform jobs. Android and iOS
retain Maestro debug output and server logs on failure. Native results are health
evidence; ordinary pull requests rely on the static and lower-level gates above.
