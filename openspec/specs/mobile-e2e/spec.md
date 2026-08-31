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
A failed attempt SHALL be retried only when its captured output positively identifies an
XCTest driver bootstrap failure: either the first `launchApp` / `setPermissions` setup failed
because the local XCTest driver was not listening or refused the connection, or Maestro 2.8.0
reported the explicit iOS driver-not-ready timeout / `IOSDriverTimeoutException` signature.
The classifier SHALL evaluate assertion-failure evidence first; unknown, application, and
assertion failures SHALL be terminal on their first occurrence even when a startup marker is
also present.

#### Scenario: A driver startup failure is retried within the bound

- **WHEN** a flow fails before an assertion with either a known first-launch XCTest
  driver-not-listening / local connection-refused signature or Maestro 2.8.0's explicit
  `iOS driver not ready in time` / `IOSDriverTimeoutException` signature
- **THEN** the harness starts a fresh Maestro process for the same flow, logs the retry reason
  and attempt number, preserves the failing exit status if all attempts fail, and never exceeds
  the configured maximum attempts

#### Scenario: A real assertion failure is never retried

- **WHEN** Maestro reports a missing element, content wait timeout, failed assertion, or any
  failure not positively classified as XCTest driver startup
- **THEN** the harness returns that non-zero result immediately, does not run the flow again,
  and does not continue to later flows

#### Scenario: Assertion evidence vetoes a startup marker

- **WHEN** one captured attempt contains both assertion-failure evidence and an otherwise
  retryable XCTest startup marker
- **THEN** the assertion evidence wins and the harness terminates after that single attempt

#### Scenario: Android and normal local runs remain single-attempt

- **WHEN** the harness is invoked without the explicit iOS startup-attempt option
- **THEN** each top-level flow is attempted exactly once

### Requirement: Main CI supplies terminal native proof

The recovery SHALL not be considered complete until a `main` SHA containing onboarding merge
`482f134f` records `SUCCESS` for both `Run mobile E2E (iOS)` and
`Run mobile E2E (Android)`, and the run includes the current onboarding flow without any flow
being ignored or optional.

#### Scenario: Both post-merge jobs prove the recovered gate

- **WHEN** the recovery change is merged to a `main` SHA descending from the onboarding merge
- **THEN** both named native jobs complete successfully and their direct job links are
  recorded before the recovery issue closes

### Requirement: A rename round trip proves the server converged, not just the local row

The suite SHALL carry a `user-calendar-rename.yaml` flow that renames a calendar through the UI and
then proves the new name came back **from the server on a device that never performed the rename**.

The flow SHALL use its own dedicated seeded calendar (`e2e-rename-calendar`), never
`e2e-smoke-calendar`: a rename is a durable server mutation, and `run_e2e.sh` runs the whole folder
in one device session, so renaming the shared smoke calendar would change state under every other
flow in the run.

A shared `rename-seed.yaml` preamble SHALL mirror `import-seed.yaml` for that token — leading
`launchApp: clearState: true`, `stopApp`, `openLink` the dev-import deep link, the optional iOS
"Open" tap, and an `extendedWaitUntil` on the post-import navigation.

The flow SHALL:

1. run `rename-seed.yaml`, then cold-start into `timecalendar-dev://user-calendars`;
2. assert the seeded **baseline** name is visible;
3. open that row's overflow menu by `id: user-calendar-actions-<seeded id>` (never by text — the
   trigger is a `Pressable` whose composed `accessibilityLabel` collapses the child text on iOS),
   choose Rename, enter the target name, and save by `id: user-calendar-rename-save`;
4. assert the new name is visible on the list (the local write);
5. run `rename-seed.yaml` **again**, whose `clearState` wipes the device and whose re-import resolves
   the token from the server, then cold-start into `timecalendar-dev://user-calendars`;
6. assert the **renamed** name is visible — a row whose name can only have come from the server.

The flow SHALL NOT use `- back` (iOS reports it COMPLETED without popping); re-entry SHALL use the
suite's `stopApp` → `launchApp` → `extendedWaitUntil` idiom. Every `extendedWaitUntil` whose
preceding top-level command is `launchApp` or `openLink` SHALL carry `timeout: 60000`. The dialog's
title string and its Save control SHALL be distinguishable from the menu's "Rename" action, so no two
live elements share one anchored selector.

The flow SHALL be cross-platform (no per-platform selector fork beyond the existing optional iOS
"Open" tap) and SHALL run under the existing `run_e2e.sh` folder run. It is native-gate work: it
SHALL be landed without blocking the pull request on an emulator run, since Maestro runs on `main`.

`mobile/e2e/README.md` SHALL record that step 2's baseline assertion requires a freshly seeded
server — CI re-seeds every run, but a local re-run without re-running the seed will fail there
because the calendar is already renamed.

#### Scenario: The rename flow round-trips through the server

- **WHEN** `user-calendar-rename.yaml` runs against the seeded server
- **THEN** the baseline name is asserted, the rename is performed through the overflow menu and the
  controlled dialog, and after a state-clearing re-import the renamed name is asserted on a freshly
  imported row

#### Scenario: The rename flow leaves the smoke calendar untouched

- **WHEN** the full folder run executes
- **THEN** `user-calendar-rename.yaml` mutates only `e2e-rename-calendar`, and every other flow's
  assertions against `e2e-smoke-calendar` are unaffected

### Requirement: The Activity flow proves the real unread and pagination round trip

The mobile Maestro suite SHALL contain one top-level `activity.yaml` flow, shared unchanged across
iOS and Android, that uses the harness-managed NestJS/Postgres server and the generated v1
calendar-log client with nothing mocked.

The flow SHALL first import the dedicated older baseline calendar into cleared app state, open
Activity so the baseline server timestamp becomes the local read watermark, and positively verify
that the baseline history rendered. It SHALL then import the dedicated newer Activity calendar
without clearing app state, causing the real sync-triggered Activity refresh to search both held
tokens with the baseline watermark.

The flow SHALL observe the exact non-zero unread state on the Settings Activity row, open Activity,
and then prove that the same unread state is absent while the Settings row remains present. It SHALL
pull to refresh and scroll until an item that exists only beyond the first 50-row response renders.

The baseline and newer imports MAY be nested Activity-only subflows, but only `activity.yaml` SHALL
be top-level so the harness does not execute setup fragments independently.

#### Scenario: Staged imports produce and clear the unread badge

- **WHEN** the flow marks the older baseline read and then imports and synchronizes the 52-row newer
  calendar without clearing device state
- **THEN** Settings exposes the Activity row with exactly 52 unread changes
- **AND** opening Activity renders the newer server-backed history and clears that unread state
- **AND** reopening Settings positively finds the Activity row without the previously observed
  unread accessible name

#### Scenario: Pull-to-refresh keeps the real timeline available

- **WHEN** the flow performs a native pull gesture at the top of the populated Activity list
- **THEN** the forced newest-page path completes without blanking or replacing the cached timeline
- **AND** a known first-page item remains visible

#### Scenario: Scrolling loads the real older page

- **WHEN** the flow scrolls until the lower-ID same-timestamp boundary item or older-page anchor is
  visible
- **THEN** that item renders from a real following-page response
- **AND** the first-page member of the timestamp pair was observed earlier in the journey

### Requirement: The Activity flow proves current routing and cancelled inertness safely

The Activity flow SHALL activate the stable new item and the stable changed item by platform-neutral
testID and SHALL observe real current event details for the corresponding current UIDs. It SHALL
attempt to activate the stable cancelled row and SHALL prove that Activity remains the active
screen and that cancelled event details did not appear.

The flow SHALL not use Maestro's `back` command. Every cold deep-link re-entry SHALL use the existing
`stopApp` → `openLink` → optional iOS confirmation → 60-second `extendedWaitUntil` idiom.

Selectors SHALL use stable testIDs or full-match accessible-name regexes that account for iOS
accessibility-container collapse. A negative assertion SHALL be paired with a prior positive match
of the same selector or with a positive current-screen anchor, so it cannot pass because the target
was never addressable or the wrong screen rendered. Below-the-fold elements SHALL be reached with
`scrollUntilVisible`.

#### Scenario: New and changed items route to current details

- **WHEN** the flow activates the seeded new item and changed item in turn
- **THEN** each opens the existing event-details screen for its current seeded UID
- **AND** a unique seeded details value is visible, ruling out the not-found state

#### Scenario: The cancelled row is inert without a vacuous assertion

- **WHEN** the flow taps the seeded cancelled row
- **THEN** the Activity list remains positively visible
- **AND** the cancelled event's details-only content is not visible

#### Scenario: The same flow is selector-safe on both platforms

- **WHEN** the committed flow is checked and then executed on iOS and Android
- **THEN** it uses no platform-specific selector fork beyond the existing optional iOS deep-link
  confirmation
- **AND** it uses no `back` command, no unscrolled below-the-fold tap, and no unanchored negative
  claim

### Requirement: The checklist Maestro journey observes progress after returning to a summary

The existing `event-checklists.yaml` real-device-local CRUD journey SHALL retain its add, toggle, and delete assertions and SHALL additionally observe the created/toggled checklist state on an event-summary surface after returning through the existing screen stack. The assertion SHALL use the real seeded synced event and real `checklist_items` store, be shared across iOS and Android, and SHALL not weaken or replace the existing CRUD proof.

#### Scenario: Created and toggled progress appears after returning from details

- **WHEN** the flow adds an item to the seeded event, toggles it complete, and returns to an existing Home, Calendar, or Agenda summary surface
- **THEN** that event summary exposes the all-complete `1/1` checklist state
- **AND** the observation fails if progress only updates after leaving and reopening the summary screen

#### Scenario: Existing CRUD proof remains intact

- **WHEN** the extended flow completes
- **THEN** it still proves typed content appears, the checkbox toggle is reflected, and cleanup hard-deletes the item

