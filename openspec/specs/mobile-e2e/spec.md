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

The `development` app variant SHALL be able to reach a server on the host machine over plain HTTP. Every Android and iOS native E2E prebuild and release-compilation step SHALL explicitly resolve `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and the platform-correct base URL (`http://10.0.2.2:3005` on Android, `http://localhost:3005` on iOS) via `EXPO_PUBLIC_API_URL`. Android cleartext traffic and iOS local-networking ATS exceptions SHALL remain enabled for that variant only. Focused workflow structure proof SHALL fail if any platform or build phase omits, duplicates, or misstates one of those inputs. That proof SHALL run in a gate that fires on a change to the native E2E workflow file alone: the baseline mobile workflow SHALL include the native E2E workflow file in its path filter and SHALL invoke both the workflow structure proof and the harness proof itself, because the native jobs that also invoke them are label-gated and therefore do not run on every pull request.

#### Scenario: A release-config dev-variant build calls the harness server

- **WHEN** a release-configuration build explicitly compiles the development identity and backend capability on an emulator/simulator while the harness server listens on host port 3005
- **THEN** the runtime selects `local` and the app's HTTP request reaches the server through the platform-correct URL without Metro running
- **AND** Android cleartext policy or iOS ATS does not block the request

#### Scenario: Every native build phase carries the complete contract

- **WHEN** the focused workflow structure proof inspects Android prebuild, Android release assembly, iOS prebuild, and iOS Release simulator build
- **THEN** each step contains exactly one development identity, exactly one development backend capability, and exactly one URL for its own platform
- **AND** no platform build step contains the other platform's local URL

#### Scenario: A change to the native E2E workflow alone is still gated

- **WHEN** a pull request modifies only the native E2E workflow file, so its label-gated
  native jobs do not run
- **THEN** the baseline mobile workflow runs anyway and executes both the workflow structure
  proof and the harness proof, failing the pull request rather than surfacing the break on
  the default branch

#### Scenario: The production variant carries no exceptions

- **WHEN** the app is built with `APP_VARIANT` unset or `production`
- **THEN** no cleartext or local-networking exception is present in the native config

#### Scenario: Missing capability still fails closed

- **WHEN** the backend capability is missing or malformed, including alongside a development app identity
- **THEN** the backend capability remains failed closed to production

### Requirement: CI runs Maestro on both platforms

CI SHALL run every top-level Maestro flow on an Android emulator (Linux runner) and an iOS
simulator (macOS runner), using release-config development-variant binaries built on the
runners—no Metro and no EAS. Both jobs SHALL install the same explicitly pinned Maestro
version, print it, and preserve debug output and server logs on failure. A recovery PR that
changes this build contract SHALL pass the baseline gate and both native jobs on one exact
reviewed head, and its handoff SHALL record that commit plus direct run/job links.

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

#### Scenario: One exact head proves seeded local routing on both platforms

- **WHEN** the recovery PR is ready for review
- **THEN** its baseline gate and both named native jobs report success for the same commit SHA
- **AND** the flow set completes seeded calendar import through the real local server and the full calendar-family round trip — agenda switch, seeded-title assertion, event details, hide/un-hide — before later B10 assertions
- **AND** the issue handoff records the exact SHA and direct run/job links, and names any flow that remains blocked by a separately ticketed stale selector rather than reporting the full set green

#### Scenario: An assertion fails while the application was never foregrounded

- **WHEN** a native attempt reports a failed assertion command, and the screen hierarchy captured for that failing step contains only system-shell nodes, with the application's own process created after the wait had already started
- **THEN** the failure SHALL be attributed to the runner rather than to the flow, the selector, the build contract, or the application, and that attribution SHALL be read from the captured hierarchy artifact — the job log reports this case identically to a real assertion failure
- **AND** the retry classifier SHALL NOT be widened to cover it, because the platform exposes no bundle attribution on hierarchy nodes and the only implementable discriminator is matching the system shell's own text, which is the signature matching this capability's structural rule replaced
- **AND** the residual platform instability SHALL be tracked on its own ticket rather than absorbed into whichever flow repair happened to surface it

### Requirement: XCTest startup retries cannot mask flow failures

The harness SHALL support a fixed, bounded number of Maestro startup attempts for iOS CI.
Whether a failed attempt may be retried SHALL be decided structurally, from Maestro's own
machine-readable per-flow command record, and SHALL NOT depend on matching stack-trace text
against a catalogue of signatures. The output assertion guard SHALL run first and SHALL win
outright. Any assertion command or other command with status `FAILED` before the final startup
failure SHALL be globally terminal, except that a failed `runFlowCommand` MAY be removed from the
veto set only while it is a live structural ancestor of that final failed startup command: it
precedes the final command, has strictly lower depth, and no intervening later entry returns to its
depth or shallower. A later restart SHALL NOT erase any other earlier failure.

Otherwise, the latest explicit `launchAppCommand`, `stopAppCommand` or `openLinkCommand` at the
failing command's depth SHALL begin the final restart epoch. A `COMPLETED` assertion before that
boundary MAY be ignored as evidence from an earlier successful phase. From the boundary through
the final command, only startup-phase commands and non-evaluated assertions MAY occur; an
evaluated assertion or non-startup interaction in the current epoch SHALL be terminal.
Assertion commands SHALL comprise Maestro's `assertConditionCommand` — into which
`assertVisible`, `assertNotVisible` and `extendedWaitUntil` all collapse — and
`scrollUntilVisible`. `COMPLETED` and `FAILED` SHALL count as evaluated; `RUNNING`, `PENDING`
and `SKIPPED` SHALL NOT. Startup-phase commands SHALL comprise `defineVariablesCommand`,
`applyConfigurationCommand`, `launchAppCommand`, `stopAppCommand`, `openLinkCommand` and
`runFlowCommand`. No per-flow record SHALL remain retryable as a pre-flow session abort. An
unreadable or malformed record SHALL be terminal, so the classifier fails closed. This rule
SHALL subsume the previously enumerated session-creation, first-`launchApp` and deep-link-reopen
signatures rather than being applied alongside them. Every retry SHALL rerun the entire
top-level flow in a fresh Maestro process and SHALL NOT resume within an epoch.

#### Scenario: A session that never opened the flow is retried

- **WHEN** Maestro aborts while creating the iOS session, so no per-flow command record exists
  for the attempt
- **THEN** the harness classifies it as a startup failure rather than an unknown one, and
  starts a fresh Maestro process for the same flow within the configured bound

#### Scenario: An attempt that died mid-launch is retried without any error text

- **WHEN** the record shows the flow's `launchAppCommand` still at `RUNNING`, no assertion
  command evaluated, and the captured output names no exception, signature or error at all
- **THEN** the harness starts a fresh Maestro process for the same flow, logs the retry reason
  and attempt number, and never exceeds the configured maximum attempts

#### Scenario: A deep-link reopen that never completed is retried

- **WHEN** the record shows `launchAppCommand` and `stopAppCommand` completed, the last
  recorded command is `openLinkCommand`, and no assertion command evaluated
- **THEN** the harness starts a fresh Maestro process for the same flow within the configured
  bound and may continue to later flows after that retry succeeds

#### Scenario: A later restart failure follows a completed earlier phase

- **WHEN** a nested import assertion completed in an earlier phase, then a new explicit
  depth-zero `stopAppCommand` completed and its `openLinkCommand` failed with no assertion
  evidence or earlier failed command
- **THEN** the harness ignores the earlier completed assertion for retry classification,
  reruns the entire top-level flow in a fresh Maestro process, and may continue to later flows
  after that retry succeeds

#### Scenario: A failed command before the final restart stays terminal

- **WHEN** an assertion or any other interaction reached `FAILED` before the final startup
  failure, even if a later restart boundary appears
- **THEN** the harness returns the original non-zero result immediately and does not retry

#### Scenario: A failed flow wrapper propagates its still-open startup child's failure

- **WHEN** a captured 29-entry record ends with a failed depth-zero `runFlowCommand` followed only
  by its still-open depth-one configuration, stop-app, and final failed open-link child commands,
  with no return to depth zero and no assertion-failure evidence
- **THEN** the classifier SHALL remove only that propagated ancestor wrapper from the global veto
  set and SHALL apply the existing final-restart-epoch rule to the failed startup child
- **AND** a retry SHALL rerun the complete top-level flow in a fresh Maestro process within the
  unchanged four-attempt maximum

#### Scenario: A failed flow wrapper is not a live ancestor

- **WHEN** a failed `runFlowCommand` is at the final command's depth, or a later entry returns to
  the wrapper's depth or shallower before the final startup failure
- **THEN** the wrapper SHALL remain an independent globally terminal failure and the harness SHALL
  return the original non-zero result without retrying

#### Scenario: A live wrapper cannot hide a failed child verdict

- **WHEN** any nested child assertion or non-startup interaction reaches `FAILED` at any depth,
  even while a failed lower-depth `runFlowCommand` remains structurally open
- **THEN** that child failure SHALL remain globally terminal and the harness SHALL NOT retry

#### Scenario: An evaluated assertion in the current restart epoch is terminal

- **WHEN** the record contains an assertion command at `COMPLETED` or `FAILED` after the latest
  restart boundary but the last recorded command is a startup-phase command
- **THEN** the harness returns the original non-zero result immediately and does not retry

#### Scenario: A non-startup interaction in the current restart epoch is terminal

- **WHEN** a tap or other non-startup interaction occurs after the latest restart boundary
  before the final startup failure
- **THEN** the harness returns the original non-zero result immediately and does not retry

#### Scenario: Assertion evidence in the output wins over the record

- **WHEN** the command record alone would look like a startup failure but the captured output
  carries assertion-failure evidence
- **THEN** the harness returns the original non-zero result immediately and does not retry

#### Scenario: A failure past startup with no assertion is terminal

- **WHEN** no assertion command evaluated but the last recorded command is not a startup-phase
  command — for example a failed tap, or a skipped assertion followed by an interaction
- **THEN** the harness returns the original non-zero result immediately and does not retry

#### Scenario: An unreadable command record is terminal

- **WHEN** the per-flow record exists but cannot be parsed as a command list
- **THEN** the harness treats the attempt as terminal and returns the original non-zero result

#### Scenario: A deterministic launch failure exhausts the bound and still fails

- **WHEN** every attempt for a flow dies mid-launch, matching the startup shape each time
- **THEN** the harness spends the configured maximum attempts, does not run later flows, and
  exits with the original non-zero status

#### Scenario: A real assertion failure is never retried

- **WHEN** Maestro reports a missing element, content wait timeout, or failed assertion
- **THEN** the harness returns that non-zero result immediately, does not run the flow again,
  and does not continue to later flows

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

### Requirement: Flow selectors resolve against the shipped app

Every selector id used by a Maestro flow SHALL resolve to a `testID` that exists in
`mobile/src`. A repository proof running in the **baseline** gate SHALL enforce this, so a UI
rework that removes a `testID` fails at the commit that causes it rather than at an on-demand
native run.

Resolution SHALL account for how both sides are actually written, because a literal
string comparison misclassifies working selectors as broken: a flow `id:` value SHALL be
matched as an anchored **regular expression**, a `testID` SHALL be collected whether it is
written as a JSX attribute or as an object property, and a template-literal `testID` SHALL
stand for the family of ids sharing its static parts.

No flow selector SHALL be left unresolved. If one ever must be deferred it SHALL be
enumerated in a documented allowlist carrying its follow-up ticket, and the proof SHALL also
fail when an allowlisted id becomes present, so the allowlist cannot rot.

Where a shipped control carries no `testID` at all — a native-header search bar, whose
`react-native-screens` options object exposes none — the flow SHALL address it by its
English label, the same locale assumption the suite's existing text assertions already make.

The shared calendar-family flows SHALL reach the agenda surface through the calendar-view
header control (`calendar-view`) and the locale-stable "Agenda" entry of its menu — one
interaction shared by both platforms, with no per-platform selector or branch.

#### Scenario: A UI rework removes a testID a flow depends on

- **WHEN** a change deletes or renames a `testID` that a Maestro flow selects by id
- **THEN** the baseline gate fails on that change
- **AND** the failure names the flow file, the line, and the unresolved id

#### Scenario: A selector or testID is not a plain literal

- **WHEN** a flow selects by a regex id, or the app declares a `testID` as an object property or a template literal
- **THEN** the proof resolves it rather than reporting it as drift
- **AND** no working id is admitted to the allowlist to silence a false positive

#### Scenario: The calendar-family flows switch to the agenda view

- **WHEN** `calendar.yaml` or `hidden-events.yaml` needs the agenda surface
- **THEN** it taps the `calendar-view` control and selects "Agenda", the same steps on Android and iOS
- **AND** `calendar.yaml` asserts the agenda list (`agenda-section-list`) mounted, which happens only in the agenda view
- **AND** the seeded-title round-trip assertions that follow are unchanged

#### Scenario: The onboarding flows reach a moved entry point

- **WHEN** `ical-import.yaml` needs the "Add by URL" entry, which moved off the welcome screen onto the school step
- **THEN** it advances the welcome carousel, takes the final CTA into the school step, and taps the "I can't find my school" action there
- **AND** `onboarding.yaml` addresses the native-header search bar by its placeholder, since that control can carry no `testID`
- **AND** both flows' existing assertions are unchanged

#### Scenario: A flow reaches a row below the fold

- **WHEN** a flow selects a control that renders outside the first screenful — the Settings
  hub's `settings-feedback` and `settings-environment` rows, or a today-timeline tile whose
  distance down the fixed-scale grid depends on the seeded event's time of day, or the restored
  hide target that follows its visible non-hidden control in the Agenda
- **THEN** it reaches that control with `scrollUntilVisible` rather than a plain visibility
  wait, because the repository proof resolves ids in source and cannot observe the device
  viewport — an existing `testID` below the fold otherwise fails identically to a deleted one
- **AND** unless the control is the last element on its screen, the reveal SHALL centre it
  (`centerElement: true`), because a scroll stops the instant the target first peeks in at the
  bottom edge — where iOS draws the floating tab bar over it — and the hierarchy still reports
  it visible, so the scroll and the following `tapOn` both report `COMPLETED` while the tap
  lands on the tab bar and silently navigates elsewhere
- **AND** where the revealed content is painted by the startup sync rather than the first
  render, the flow SHALL wait on an element the sync produces before scrolling, so the scroll
  cannot race the render and exhaust an empty list
- **AND** a final positive assertion SHALL follow the restored hide target's centred reveal,
  preserving the hide → absent → un-hide → present round trip rather than treating the scroll
  command alone as its terminal proof

#### Scenario: A known-stale selector is repaired

- **WHEN** an id listed in the proof's known-stale allowlist is reintroduced as a real `testID`
- **THEN** the proof fails until that id is removed from the allowlist

#### Scenario: A native header exposes an accessibility label distinct from its visual text

- **WHEN** a shared flow drives a native header action whose visual title differs from the
  accessibility label exposed in the Maestro hierarchy, such as the event-details `Hide`
  action exposed as `Hide this event`
- **THEN** the flow selects the action by the complete accessibility label that both platforms
  expose, rather than by visual text that exists in a screenshot but not in the hierarchy
- **AND** the interaction remains shared across Android and iOS and retains the following
  application assertion or round-trip proof
- **AND** where that label is not unique in the hierarchy, the flow disambiguates it per the
  collision scenario below rather than relying on match order

#### Scenario: A selector matches a second live element

- **WHEN** a flow's text or accessibility-label selector matches more than one element
  present in the hierarchy at the same moment — as the event-details header action and the
  native Alert chooser option do, both exposing the byte-identical `Hide this event` from
  two different i18n keys
- **THEN** the flow SHALL disambiguate with a relative anchor only the intended element can
  satisfy: the chooser option is selected `below:` the Alert title `Hide event`, a
  full-match regex no colliding string satisfies and which the header — drawn above the
  alert on both platforms — can never sit under
- **AND** the flow SHALL first wait on an element unique to the disambiguating surface (the
  chooser's `Hide all events of the same name`), so an alert that never presents fails
  explicitly at a named step instead of silently re-tapping the first match
- **AND** the disambiguation SHALL stay cross-platform, with no per-platform selector or
  branch, and SHALL NOT weaken the round trip the flow proves
- **AND** the repository selector proof is not expected to catch this class: it resolves ids
  in source and cannot observe runtime ambiguity, the same limit the below-the-fold scenario
  records — a colliding selector fails only on a device, and it fails downstream of the tap,
  at an assertion that names an unrelated element

#### Scenario: A flow command succeeds on one platform and is a no-op on the other

- **WHEN** a shared flow issues a command whose implementation differs per platform — as
  Maestro's bare `back` does, driving Android's hardware back key but a left-edge swipe on
  iOS, which reports `COMPLETED` without popping a native-stack screen
- **THEN** the flow SHALL NOT use that command, and SHALL re-enter a root screen with the
  shared `stopApp` + `launchApp` restart idiom instead
- **AND** the repository selector proof SHALL reject a bare `back` in any flow, naming the
  file and line
- **AND** unlike the below-the-fold and collision classes, this one IS statically decidable:
  the command is a literal in the flow, so the proof catches it without a device — and it
  must, because the platform that passes hides it, and the platform that fails reports it as
  a timed-out assertion on the screen the flow believed it had already left

#### Scenario: A cold-launch readiness wait is outlasted by a degraded runner

- **WHEN** a flow's first wait after a `launchApp` — a readiness bound on how long the device
  may take to render, not a claim about application behaviour — expires because the
  release-config launch was abnormally slow, as in run `33216821519` where `launchApp` alone
  took 75.8 s and the following 60 s wait then elapsed in full
- **THEN** the retry budget SHALL NOT be widened to cover it: the attempt is past `launchApp`
  and its last record is a failed assertion, so classifying it retryable would weaken the
  assertion guard that runs first — and a first-screen assertion is exactly where a genuine
  boot regression also surfaces
- **AND** the readiness wait itself SHALL instead be sized for the slowest observed runner
  rather than the typical one, at every site where it immediately follows a `launchApp`, so
  the same degraded session cannot terminate a different flow at the same gate
- **AND** the site SHALL record the measured launch duration and the run it came from, so a
  future reader can tell a provenance-backed bound from an arbitrary one
- **AND** this widening is sound because it is one-directional: a longer wait converts only a
  slow render into a pass, while an app that never renders the awaited element fails at the
  raised bound exactly as it did at the original one — it cannot produce a false green
- **AND** the class is distinguished from a true assertion failure by its command record: a
  handful of commands ending at the launch gate, against the many recorded commands and
  genuinely-rendered element of the collision class

#### Scenario: A seeded fixture is outlived by the job that observes it

- **WHEN** a native job seeds its fixture calendar once at start-up and then runs long enough
  to cross a UTC midnight before a flow asserts that fixture through the agenda, whose window
  is `[today 00:00, today + 7 days)` and forward-only, recomputed from the **device** clock at
  the moment the flow mounts it — as in run `33220510226`, where the server seeded on Aug 28,
  iOS reached `hidden-events` on Aug 29, and the agenda rendered `No events this period.`
- **THEN** the failure SHALL be classified as a seed/date-contract defect and not as a defect
  in the feature under test: every command up to the assertion completed, the hide chooser was
  tapped, and only the observation window moved
- **AND** a fixture asserted through the agenda SHALL be anchored on the UTC day **after** the
  seed run, which lies inside the window from both the seed day's anchor and the next day's,
  so one crossing cannot move it out; the flow's runtime is bounded far below a second crossing
- **AND** its title SHALL be date-neutral, because a `Today`-named event that is deliberately
  not today sends the next reader hunting an application bug
- **AND** a non-hidden control asserted alongside a target SHALL share the target's day: a
  control exists to keep an empty view from satisfying `assertNotVisible` vacuously, and one
  that does not outlive the crossing its target survives stops doing that job on exactly the
  run that needs it
- **AND** a flow that can only be satisfied by the seed day — the _today_ timeline — SHALL keep
  that anchor, with its residual one-crossing exposure recorded and pinned by the seed proof
  rather than left to be re-derived from a red gate
- **AND** the contract SHALL be proven without a database, by a pure builder taking the seed
  instant, since what breaks here is date arithmetic and a mocked repository would exercise the
  ORM instead

#### Scenario: A measured first-page pagination traversal exceeds the default bound

- **WHEN** a real-server Activity flow must traverse to the final row of its 50-row first page,
  and a native gate shows both platforms still making forward progress when the default
  60-second scroll bound expires
- **THEN** only that row-50 `tie-higher` traversal SHALL receive the measured 120-second bound
- **AND** the following `tie-lower` and `older-anchor` traversals SHALL remain at 60 seconds,
  preserving their order and every assertion that proves cursor paging and tie ordering
- **AND** a focused repository proof SHALL fail if the first bound returns to 60 seconds, either
  later bound is widened, or the three pagination selectors are reordered

#### Scenario: A merged onboarding journey moves the URL-import entry deeper

- **WHEN** the school step's unlisted-institution action no longer opens the iCal URL screen
  directly, but instead begins the shipped institution → programme → connect → manual-import
  journey
- **THEN** `ical-import.yaml` SHALL follow that shared journey through stable shipped ids and
  select the manual-import screen's URL option, rather than timing out on the institution step
  or deep-linking around the user-visible entry
- **AND** the existing URL-screen title and empty-submit validation assertions SHALL remain
  unchanged, with no platform-specific selector or branch
- **AND** a focused repository proof SHALL pin the inserted route edges in order, so a future
  navigation change fails the baseline gate before another native cycle

#### Scenario: A controlled input echoes a stale value across an erase boundary

- **WHEN** a native flow clears a controlled input immediately before typing a value that will be
  sent by an irreversible Save action, and a late controlled-state echo can restore a suffix from
  the seeded value
- **THEN** the flow SHALL cross a second consecutive erase boundary before entering the target
  value
- **AND** Save SHALL remain gated behind a bounded selector that conjunctively matches the input
  id and the complete exact target value, so any remaining prefix or suffix fails before the
  server mutation
- **AND** a focused repository proof SHALL pin the two erases, exact in-field gate, Save order,
  and the existing local-write plus wiped-device server-convergence assertions

#### Scenario: Keyboard dismissal fails after the next control is actionable

- **WHEN** a shared flow has entered its value and the captured hierarchy already exposes the
  next Continue control as visible and enabled, but a keyboard-dismiss command fails because the
  input is already unfocused while native keyboard chrome remains in the hierarchy
- **THEN** the flow SHALL remove that terminal dismiss command and wait for the existing Continue
  control with a bounded id selector before tapping it
- **AND** the flow SHALL retain the explicit Continue interaction rather than substituting a
  return-key submission, optional command, platform branch, or deep link around the route
- **AND** a focused repository proof SHALL reject any keyboard-dismiss command and pin each
  input → matching Continue wait → matching Continue tap sequence

#### Scenario: A merged checklist-summary journey retains obsolete navigation

- **WHEN** the pull-request merge result adds checklist progress assertions to a shared flow but
  carries an agenda selector removed from the shipped calendar header, a bare seeded-title
  selector, or a platform-asymmetric `back` command
- **THEN** the flow SHALL enter Agenda through the shared `calendar-view` menu and use the
  cross-platform composed-label regex for every event-container interaction
- **AND** after toggling the local checklist row it SHALL cold re-enter Calendar without clearing
  state, dismiss the optional iOS system confirmation, wait for Calendar readiness, and navigate
  through the same shared Agenda control before requiring the exact `1/1` progress id
- **AND** it SHALL reopen the real seeded event and retain the hard-delete cleanup, so the local
  SQLite add → type → toggle → progress → reopen → delete round trip is not weakened
- **AND** a focused repository proof SHALL pin the ordered re-entry and fail if the stale agenda
  id, a bare seeded title, or a bare `back` command returns

#### Scenario: A cancelled destructive prompt must preserve a row across native-stack exit

- **WHEN** a shared flow cancels a destructive native prompt on a pushed edit screen and must
  leave that screen before proving the persisted row remains
- **THEN** it SHALL re-enter the owning root route with `stopApp` → deep link → optional iOS
  confirmation, without clearing application state
- **AND** it SHALL wait for the exact preserved row before reopening it, explicitly confirm the
  destructive action, and require the same exact row to become absent
- **AND** a focused repository proof SHALL reject a bare `back`, missing or reordered cold
  re-entry, a weakened preserved-row assertion, or a weakened confirmed-deletion assertion

#### Scenario: A successful keyboard command navigates away from the asserted screen

- **WHEN** a shared checklist flow types a row and a keyboard-dismiss command reports success but
  acts as Android Back because the input is already unfocused
- **THEN** the flow SHALL contain no keyboard-dismiss command and SHALL first wait up to 15 seconds
  for one selector that conjunctively matches the live checklist input id and exact typed value
- **AND** it SHALL cold re-enter Calendar without clearing state, reopen the seeded event, and
  require the persisted typed row before toggling it
- **AND** the subsequent exact progress proof, reopen, hard-delete, and exact absence assertion
  SHALL remain in order, with a focused mutation proof rejecting any lost or reordered stage

#### Scenario: A hierarchy-visible onboarding CTA is covered by the keyboard

- **WHEN** iOS exposes an institution or programme Continue control in the accessibility hierarchy
  while native keyboard chrome physically covers its tappable bounds
- **THEN** the institution form SHALL retain its device-proven keyboard-avoiding
  scroll/tap-handling layout, while the programme form SHALL place its existing Continue control as
  a sticky sibling after the scroll and inside the same keyboard-avoiding view
- **AND** the shared flow SHALL gate each explicit CTA tap behind both an exact conjunctive
  input-id/value wait and the existing bounded CTA-id wait, with no keyboard-dismiss command,
  Return-key submission, coordinate tap, optional route proof, deep-link bypass, or platform fork
- **AND** focused component and flow mutation proofs SHALL fail if either CTA can return behind the
  iOS keyboard, either exact value gate is removed or widened, or either CTA tap is bypassed

#### Scenario: A focused exact-value input is covered by the keyboard

- **WHEN** a shared checklist flow has entered the exact typed value and the focused input remains
  in the hierarchy but its bounds sit behind the software keyboard, so Maestro marks it not visible
- **THEN** the flow SHALL scroll the same conjunctive input-id and exact-value selector downward
  until it is 100% visible and centred, within a bounded 30-second reveal
- **AND** that reveal SHALL precede the existing bounded exact-value visibility gate and SHALL be
  shared across platforms and inert when the input is already fully visible
- **AND** the subsequent state-preserving cold re-entry, persisted-row assertion, toggle/progress,
  hard-delete, and exact absence proof SHALL remain in order
- **AND** focused mutation proof SHALL reject a removed, widened, reordered, uncentred, or
  partially-visible reveal and any weakening of the readiness gate or persistence round trip

#### Scenario: A focused field covers and consumes its Continue transition

- **WHEN** a focused institution or programme field leaves its body Continue control behind the
  software keyboard, and the first otherwise-successful CTA tap can be consumed only to dismiss or
  defocus that keyboard
- **THEN** the flow SHALL reveal the matching Continue id downward until it is 100% visible and
  centred within 30 seconds before retaining the existing bounded CTA visibility wait
- **AND** it SHALL keep the required CTA tap followed by exactly one optional same-id tap, so the
  fallback is inert after navigation but performs the transition when the first tap only changes
  keyboard state
- **AND** the next-screen wait SHALL remain mandatory and SHALL prove the route transition
  non-vacuously, with no platform fork, keyboard-dismiss command, Return submission, coordinate tap,
  selector widening, or route bypass
- **AND** focused mutation proof SHALL reject a missing, widened, reordered, uncentred,
  partially-visible, or unbounded reveal; a removed or required fallback; a missing required tap;
  or a bypassed downstream route wait

#### Scenario: A scroll-contained programme CTA remains physically occluded

- **WHEN** the exact programme value gate, full centred reveal, bounded CTA wait, required CTA tap,
  and optional same-id fallback all complete, but the mandatory Connect wait expires with the
  focused keyboard still physically covering the programme CTA
- **THEN** the existing programme CTA SHALL move unchanged out of the `ScrollView` and become the
  immediate sticky sibling after that scroll while remaining inside the existing
  `KeyboardAvoidingView`
- **AND** the scroll SHALL contain zero programme CTAs, the avoiding view SHALL contain exactly one,
  and focused mutation proof SHALL reject moving it back inside the scroll, outside the avoiding
  view, before the scroll, duplicating it, or losing iOS `padding` or scroll tap-handling semantics
- **AND** the institution screen and the shared programme sequence SHALL remain unchanged, so the
  next native gate still proves the explicit visible CTA transition rather than a Return-key,
  keyboard-dismiss, coordinate, platform-fork, optional-route, or deep-link bypass

#### Scenario: An exact controlled-input suffix survives both erase boundaries

- **WHEN** the rename input is focused and exposes the conjunctive exact state
  `id: user-calendar-rename-input` plus `text: E2E Renamed Timetablee` after both broad erase
  commands and target input have completed
- **THEN** one conditional shared subflow SHALL select only that exact wrong state, tap at
  `99%,50%` relative to the same input element, and erase exactly one character
- **AND** once the condition matches, neither the element-relative tap nor the one-character erase
  SHALL be optional; if the input was already exact, the whole correction SHALL be skipped
- **AND** the existing bounded gate SHALL still require the conjunctive exact target
  `user-calendar-rename-input` plus `E2E Renamed Timetable` before Save, so any other corruption
  remains terminal before a server write
- **AND** focused mutation proof SHALL reject a missing or widened wrong-value condition, a
  screen-global or non-input coordinate, an erase count other than one, Save before the exact
  target gate, or any weakened baseline/local-write/wipe/re-import/server-convergence assertion

### Requirement: Retry-classifier harness isolates distinguishable structural branches

The deterministic Maestro shell harness SHALL protect assertion-family recognition, `runFlowCommand` startup-phase membership, `openLinkCommand` restart-boundary membership, and the explicit empty-command-list branch with independent minimal fixtures. Each fixture SHALL be retryable under the production classifier, SHALL become terminal under its named mutation, and SHALL remain retryable under each of the other three listed mutations.

#### Scenario: Non-evaluated assertion recognition is protected

- **WHEN** the final same-depth restart epoch contains `assertConditionCommand` at `PENDING` followed by a non-boundary startup command other than `runFlowCommand`
- **THEN** the unmodified classifier SHALL treat the record as retryable
- **AND** only forcing assertion-family recognition to return false among the four listed mutations SHALL make the record terminal

#### Scenario: Run-flow startup membership is protected

- **WHEN** a startup-only record with no evaluated assertion ends in `runFlowCommand`
- **THEN** the unmodified classifier SHALL treat the record as retryable
- **AND** only removing `runFlowCommand` from the startup-phase command set among the four listed mutations SHALL make the record terminal

#### Scenario: Open-link restart-boundary membership is protected

- **WHEN** an evaluated assertion precedes a same-depth `openLinkCommand` restart boundary and no evaluated command follows that boundary
- **THEN** the unmodified classifier SHALL exclude the earlier assertion and treat the record as retryable
- **AND** only removing `openLinkCommand` from the restart-boundary command set among the four listed mutations SHALL make the record terminal

#### Scenario: Empty command record reaches the classifier

- **WHEN** a failed first attempt writes a parseable `commands.json` containing an empty list
- **THEN** the unmodified classifier SHALL treat the record as retryable and report `0 command(s) recorded, last=none status=none`
- **AND** only forcing the explicit empty-list branch to return false among the four listed mutations SHALL make the record terminal

