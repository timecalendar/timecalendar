# mobile-e2e Specification

## Purpose

TBD - created by archiving change add-mobile-test-harness. Update Purpose after archive.
## Requirements
### Requirement: Real-round-trip Maestro flow

The mobile app SHALL have Maestro flows that prove the app ↔ server contract end to end
against the harness-managed NestJS instance, with **nothing mocked**. In addition to the
`GET /schools` read, the calendar-family flows SHALL make the app durably hold the seeded
`e2e-smoke-calendar` token via the dev-variant import deep link
(`timecalendar-dev://dev-import?token=e2e-smoke-calendar`), trigger a sync, and assert that
**real seeded synced data renders** — proving app → generated client → `customFetch` →
NestJS → Postgres for the calendar surface. Flows live in `mobile/.maestro/`, are shared
across platforms (stable seeded/localized text, no per-platform selectors), and preserve the
cold-start `stopApp`→`openLink` idiom with generous `extendedWaitUntil` timeouts. A shared
import preamble (`import-seed.yaml`) SHALL hold the single import-then-sync step the
calendar-family flows reuse.

#### Scenario: Seeded schools render through the generated client

- **WHEN** the Maestro flow launches the development-variant app and opens the
  `timecalendar-dev://schools` deep link with the harness server running
- **THEN** the schools screen fetches via the generated Orval hook through `customFetch`, and
  the flow asserts a seeded school's name is visible — failing if the endpoint, its DTO, the
  generated client, or the QueryClient wiring is broken

#### Scenario: The seeded calendar token is imported and its events sync

- **WHEN** a calendar-family flow runs the import preamble (opens
  `timecalendar-dev://dev-import?token=e2e-smoke-calendar`) with the harness server running
- **THEN** the app resolves the token, holds it in `user_calendars`, syncs the seeded events,
  and the seeded synced data becomes renderable in the calendar/home/details views —
  no reliance on empty/not-found states

### Requirement: The calendar flow asserts a real synced tile and real event details

The `calendar.yaml` flow SHALL, after importing the seeded token, assert that a seeded synced
event's title renders on the calendar surface (a real tile, not the empty state), and that
tapping that event opens the event-details screen showing **real content** (the seeded title
/ a content line) — NOT the "no longer available" not-found message. This SHALL replace the
prior reachability-only assertions (empty state + a deep-linked not-found details route). The
flow's header comment SHALL be rewritten to describe the real round-trip (the
"SEEDED-DATA LIMITATION" note removed).

#### Scenario: A synced tile renders on the calendar

- **WHEN** the calendar flow imports the seeded token and opens the calendar
- **THEN** a seeded event's title is visible on the rendered calendar surface

#### Scenario: Tapping a synced event opens real details

- **WHEN** the flow taps the seeded event
- **THEN** the event-details screen shows the real seeded title/content, and the not-found
  message is NOT shown

### Requirement: The home flow asserts a populated today timeline

The `home.yaml` flow SHALL, after importing the seeded token, assert that a seeded event
anchored on **today** is visible on the Home tab's today timeline (a real tile, not the
empty-day state). This SHALL replace the prior empty-day reachability assertion. The header
comment SHALL be rewritten to the real round-trip.

#### Scenario: Today's seeded event renders on home

- **WHEN** the home flow imports the seeded token and lands on the Home tab
- **THEN** a today-anchored seeded event's title is visible on the today timeline, and the
  empty-day state is NOT the asserted state

### Requirement: The event-checklists flow round-trips a checklist through the real DB

The `event-checklists.yaml` flow SHALL, after importing the seeded token, open a real synced
event's details, add a checklist item, toggle it, and delete it — round-tripping through the
real device-local `checklist_items` store — asserting the typed content appears and then is
gone. This SHALL replace the prior not-found reachability assertion. The header comment SHALL
be rewritten to the real round-trip.

#### Scenario: A checklist item is added, toggled, and deleted on a real event

- **WHEN** the flow opens a seeded synced event's details, adds a checklist item with typed
  content, toggles it, and deletes it
- **THEN** the typed content is visible after add, the toggle is reflected, and the item is
  gone after delete — proving the write path against the real store

### Requirement: The hidden-events flow round-trips a hide/un-hide on a real synced event

The `hidden-events.yaml` flow SHALL, after importing the seeded token, hide a real synced
event from its details, assert it disappears from the views, open the hidden-events screen,
assert it is listed, un-hide it, and assert it reappears. This SHALL replace the prior
empty-state reachability assertion. The flow SHALL leave the hidden set restored (un-hidden)
at the end. The header comment SHALL be rewritten to the real round-trip.

#### Scenario: Hide then un-hide a real synced event

- **WHEN** the flow hides a seeded synced event from its details, then un-hides it in the
  hidden-events screen
- **THEN** the event is absent from the views while hidden, listed on the hidden-events
  screen, and visible again after un-hide

### Requirement: The rewritten flows stay cross-platform and cold-start-idiomatic

The rewritten flows SHALL remain shared across iOS and Android (localized/seeded text
assertions and platform-neutral testIDs only — no per-platform selectors), SHALL preserve the
`stopApp`→`openLink` cold-start idiom and the iOS first-deep-link "Open" confirmation
handling, and SHALL keep generous `extendedWaitUntil` timeouts around the first synced-data
assertion (to cover a release-config cold start plus the sync settle).

#### Scenario: A flow runs unchanged on both platforms

- **WHEN** any rewritten flow runs on the iOS simulator and the Android emulator in CI
- **THEN** it uses the same steps and text/testID assertions on both, with the cold-start
  `stopApp`→`openLink` preamble and the iOS "Open" optional tap

### Requirement: Single-command local e2e run

The repository SHALL provide one command that boots the server stack once, runs every
top-level Maestro YAML against the connected simulator/emulator in a separate Maestro CLI
process, reports pass/fail, and tears the stack down once—including on failure—with a
`--keep-up` debugging escape hatch matching the Flutter harness's UX. The flow list SHALL be
derived deterministically from `mobile/.maestro/*.yaml`; no existing top-level YAML may be
omitted.

#### Scenario: One command runs the whole isolated loop

- **WHEN** `mobile/e2e/run_e2e.sh` is run with a booted iOS simulator or Android emulator and
  an installed e2e build
- **THEN** it brings the server stack up once via the shared lifecycle, invokes
  `maestro test <flow>` once per top-level YAML in deterministic order, exits with the first
  terminal non-zero flow status or zero after all pass, and tears the stack down once

#### Scenario: --keep-up leaves the stack for debugging

- **WHEN** the wrapper is run with `--keep-up`
- **THEN** the server stack stays up after the run and the command reports how to inspect logs
  and tear down manually

#### Scenario: A newly added top-level flow is not skipped

- **WHEN** a valid YAML file is added directly under `mobile/.maestro/`
- **THEN** the next wrapper run discovers and executes it without a separate manifest change

### Requirement: E2E builds reach the local server

The `development` app variant SHALL be able to reach a server on the host machine over plain HTTP — Android cleartext traffic and iOS local-networking ATS exceptions are enabled for that variant only, and the e2e build bakes the platform-correct base URL (`http://10.0.2.2:3005` on Android, `http://localhost:3005` on iOS) via `EXPO_PUBLIC_API_URL`.

#### Scenario: A release-config dev-variant build calls the harness server

- **WHEN** a release-configuration build of the `development` variant runs on an emulator/simulator while the harness server listens on host port 3005
- **THEN** the app's HTTP request reaches the server (not blocked by Android cleartext policy or iOS ATS) without Metro running

#### Scenario: The production variant carries no exceptions

- **WHEN** the app is built with `APP_VARIANT` unset or `production`
- **THEN** no cleartext or local-networking exception is present in the native config

### Requirement: CI runs Maestro on both platforms

CI SHALL run every top-level Maestro flow on an Android emulator (Linux runner) and an iOS
simulator (macOS runner), using release-config development-variant binaries built on the
runners—no Metro and no EAS. Both jobs SHALL install the same explicitly pinned Maestro
version, print it, and preserve debug output and server logs on failure.

#### Scenario: Android e2e builds within explicit hosted-runner bounds

- **WHEN** the `e2e-mobile-android` job runs
- **THEN** it loads the `build-server` image artifact, builds the release APK via
  `expo prebuild` and Gradle with a 3072 MiB heap, 1024 MiB Metaspace, at most two workers,
  and no persistent daemon, installs it on the hardware-accelerated emulator, and proceeds to
  every Maestro flow without a Metaspace OOM or orphan Gradle process

#### Scenario: iOS e2e uses isolated XCTest lifecycles

- **WHEN** the `e2e-mobile-ios` job runs on a macOS runner
- **THEN** it provisions Postgres/Redis natively, builds and installs the Release simulator
  app, boots the server once through native mode, and invokes every top-level flow in a fresh
  Maestro process so a dead driver from one flow is not reused by another

#### Scenario: CI records the selected native toolchain

- **WHEN** either native job installs Maestro and the iOS job selects its simulator
- **THEN** logs contain Maestro 2.8.0 exactly and the iOS logs also contain the selected Xcode
  version/path, simulator name and UDID, and iOS runtime

#### Scenario: Failures leave evidence

- **WHEN** a native build or Maestro flow fails in CI
- **THEN** the job remains failed and uploads Maestro debug output plus server logs without
  introducing secrets

### Requirement: XCTest startup retries cannot mask flow failures

The harness SHALL support a fixed, bounded number of Maestro startup attempts for iOS CI.
A failed attempt SHALL be retried only when its captured output proves the first
`launchApp` setup failed because the local XCTest driver was not listening or refused the
connection and contains no completed assertion or assertion-failure evidence. Unknown,
application, and assertion failures SHALL be terminal on their first occurrence.

#### Scenario: A driver startup failure is retried within the bound

- **WHEN** a flow's first `launchApp` fails during `setPermissions` with a known XCTest
  driver-not-listening or local connection-refused signature before any assertion runs
- **THEN** the harness starts a fresh Maestro process for the same flow, logs the retry reason
  and attempt number, and never exceeds the configured maximum attempts

#### Scenario: A real assertion failure is never retried

- **WHEN** Maestro reports a missing element, content wait timeout, failed assertion, or any
  failure not positively classified as first-launch driver startup
- **THEN** the harness returns that non-zero result immediately, does not run the flow again,
  and does not continue to later flows

#### Scenario: Android and normal local runs remain single-attempt

- **WHEN** the harness is invoked without the explicit iOS startup-attempt option
- **THEN** each top-level flow is attempted exactly once

### Requirement: iOS launch SIGSEGV recovery is bounded and attributable

When `--startup-attempts` allows retries, the E2E harness SHALL retry a failed flow only
when fresh simulator-log evidence for that flow's current attempt positively identifies
the TimeCalendar development app process exiting with `SIGSEGV(11)` during launch or
relaunch, or when the existing positively classified XCTest startup transport failure
applies. The retry SHALL consume the existing per-flow attempt ceiling and SHALL start a
fresh Maestro process. The harness SHALL NOT weaken, remove, or make optional any seeded
data, event-details, application, server, or persistence assertion.

#### Scenario: First-attempt app launch SIGSEGV recovers

- **WHEN** the first attempt fails and only that attempt's fresh, app-specific simulator
  log identifies a launch/relaunch `SIGSEGV(11)`, and the next attempt passes
- **THEN** the harness starts a fresh Maestro process for the retry and reports the flow as
  passed without restarting the shared server

#### Scenario: Repeated app launch SIGSEGV exhausts the existing bound

- **WHEN** every attempt through the configured per-flow ceiling has fresh, app-specific
  simulator-log evidence of launch/relaunch `SIGSEGV(11)` and fails
- **THEN** the harness makes no attempt beyond that ceiling, returns the final nonzero flow
  result, and does not run later flows

#### Scenario: Ordinary failures remain terminal

- **WHEN** a flow fails an assertion, seeded-data check, server interaction, application
  behavior, or unknown step without fresh qualifying app-process SIGSEGV or existing XCTest
  transport evidence
- **THEN** the harness returns that first nonzero result without retrying the flow

#### Scenario: Stale and cross-flow simulator logs cannot authorize a retry

- **WHEN** `SIGSEGV(11)` evidence exists only before the current attempt boundary, in a
  prior attempt's artifact, for another flow, or for another process
- **THEN** the current failure is terminal and the harness does not retry

#### Scenario: Simulator-log inspection fails closed

- **WHEN** the booted simulator cannot be queried or its log output does not positively
  match the current attempt, app identity, and `SIGSEGV(11)`
- **THEN** the simulator-log classifier does not authorize a retry and the original failure
  classification remains in force

### Requirement: Main CI supplies terminal native proof

The recovery SHALL not be considered complete until a `main` SHA containing onboarding merge
`482f134f` records `SUCCESS` for both `Run mobile E2E (iOS)` and
`Run mobile E2E (Android)`, and the run includes the current onboarding flow without any flow
being ignored or optional.

#### Scenario: Both post-merge jobs prove the recovered gate

- **WHEN** the recovery change is merged to a `main` SHA descending from the onboarding merge
- **THEN** both named native jobs complete successfully and their direct job links are
  recorded before the recovery issue closes

### Requirement: Seeded calendar flows use the live native view menu

Calendar-family Maestro flows that require Agenda SHALL open the stable `calendar-view`
control and select its visible `Agenda` native menu action on Android and iOS. They SHALL NOT
target the removed `calendar-view-agenda` item id. The anchor `calendar.yaml` flow SHALL keep
the real seeded-event and event-details assertions after switching views.

#### Scenario: Calendar round-trip reaches Agenda through the native menu

- **WHEN** `calendar.yaml` completes the seeded dev import
- **THEN** it opens `calendar-view`, selects `Agenda`, sees `E2E Today Lecture`, opens that
  synced event, and sees `Room E2E Lecture`

#### Scenario: Every affected flow avoids the removed selector

- **WHEN** the native suite runs all committed calendar-family Maestro flows
- **THEN** no affected flow refers to `calendar-view-agenda`, and each retains its existing
  seeded content and journey assertions

#### Scenario: Both native jobs prove the integrated head

- **WHEN** the exact integrated PR head is ready for Reviewer sign-off
- **THEN** the labelled Android and iOS native E2E jobs both pass without a timeout-only
  workaround, mock-only import path, workflow change, or weakened seeded-data assertion

### Requirement: Settings child routes return through supported platform interactions

The shared Settings Maestro flow SHALL activate the visible native header back affordance
on iOS and SHALL retain the supported system-back interaction on Android after visiting each
Settings child route. Navigation and destination assertions SHALL remain required on both
platforms.

#### Scenario: My calendars returns to Settings

- **WHEN** the flow opens **My calendars** from `settings-calendar-summary`
- **THEN** iOS activates `BackButton`, Android performs system back, and both platforms
  observe **Settings** before continuing

#### Scenario: Appearance and language returns to Settings

- **WHEN** the flow opens **Appearance & language** from Settings
- **THEN** iOS activates `BackButton`, Android performs system back, and both platforms
  observe **Settings** after the return

#### Scenario: Return remains a strict gate

- **WHEN** either platform cannot activate its supported return interaction
- **THEN** the flow fails without an optionalized command, removed Settings assertion,
  timeout-only workaround, product-navigation change, or CI/workflow change

### Requirement: Stale recovery observes retained content through the native agenda label

The stale-source Maestro flow SHALL require the unique retained-event title within the
visible agenda row's accessibility text on Android and iOS. The assertion SHALL support the
grouped iOS label without becoming optional, changing its 60-second synchronization bound,
or weakening any downstream recovery gate. Its immediately following required wait and tap
SHALL match the visible `Review` title within the control's accessibility label on both
platforms while preserving the existing 60-second wait. The later required re-add tap SHALL
match its Add/update/calendar semantics within the visible control label on both platforms
and SHALL preserve the final school-selection destination gate.

#### Scenario: Grouped iOS label proves the retained event

- **WHEN** iOS exposes the agenda row as a grouped label containing `E2E Last Good Lecture`
  together with its time, room, and details action
- **THEN** the flow observes the required title and continues to the recovery journey

#### Scenario: Android retains the same semantic proof

- **WHEN** Android renders the seeded retained event in Agenda
- **THEN** the same title-bearing selector observes `E2E Last Good Lecture` within 60 seconds

#### Scenario: Downstream recovery gates remain mandatory

- **WHEN** the retained event has been observed
- **THEN** the flow still requires **Review**, **E2E Stale Calendar**, **Source needs
  attention**, **Add updated calendar**, and the final school-selection destination

#### Scenario: Grouped iOS label activates the Review control

- **WHEN** iOS exposes the visible Review button as a grouped accessibility label containing
  `Review` together with its calendar-source guidance
- **THEN** the required wait observes that title within 60 seconds and the required tap uses
  the same title-bearing selector before every later recovery gate runs

#### Scenario: Calendar-specific iOS label activates re-add

- **WHEN** Android exposes `Add updated calendar`, iOS exposes
  `Add an updated calendar for E2E Stale Calendar`, and explanatory copy contains similar
  words
- **THEN** the required tap selects only one of the complete button labels and the flow still
  requires the final school-selection destination
