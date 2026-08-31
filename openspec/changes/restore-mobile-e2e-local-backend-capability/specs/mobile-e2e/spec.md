## MODIFIED Requirements

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

### Requirement: XCTest startup retries cannot mask flow failures

The harness SHALL support a fixed, bounded number of Maestro startup attempts for iOS CI.
Whether a failed attempt may be retried SHALL be decided structurally, from Maestro's own
machine-readable per-flow command record, and SHALL NOT depend on matching stack-trace text
against a catalogue of signatures. The output assertion guard SHALL run first and SHALL win
outright. Any assertion command or other command with status `FAILED` before the final startup
failure SHALL be globally terminal; a later restart SHALL NOT erase an earlier failure.

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

## ADDED Requirements

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
- **THEN** each onboarding form SHALL use the repository's keyboard-avoiding scroll/tap-handling
  layout so its existing body Continue control remains visible and tappable after typing
- **AND** the shared flow SHALL gate each explicit CTA tap behind both an exact conjunctive
  input-id/value wait and the existing bounded CTA-id wait, with no keyboard-dismiss command,
  Return-key submission, coordinate tap, optional CTA, deep-link bypass, or platform fork
- **AND** focused component and flow mutation proofs SHALL fail if either CTA can return behind the
  iOS keyboard, either exact value gate is removed or widened, or either CTA tap is bypassed
