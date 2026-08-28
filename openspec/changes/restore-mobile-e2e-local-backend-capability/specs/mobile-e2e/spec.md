## MODIFIED Requirements

### Requirement: E2E builds reach the local server

The `development` app variant SHALL be able to reach a server on the host machine over plain HTTP. Every Android and iOS native E2E prebuild and release-compilation step SHALL explicitly resolve `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and the platform-correct base URL (`http://10.0.2.2:3005` on Android, `http://localhost:3005` on iOS) via `EXPO_PUBLIC_API_URL`. Android cleartext traffic and iOS local-networking ATS exceptions SHALL remain enabled for that variant only. Focused workflow structure proof SHALL fail if any platform or build phase omits, duplicates, or misstates one of those inputs.

#### Scenario: A release-config dev-variant build calls the harness server

- **WHEN** a release-configuration build explicitly compiles the development identity and backend capability on an emulator/simulator while the harness server listens on host port 3005
- **THEN** the runtime selects `local` and the app's HTTP request reaches the server through the platform-correct URL without Metro running
- **AND** Android cleartext policy or iOS ATS does not block the request

#### Scenario: Every native build phase carries the complete contract

- **WHEN** the focused workflow structure proof inspects Android prebuild, Android release assembly, iOS prebuild, and iOS Release simulator build
- **THEN** each step contains exactly one development identity, exactly one development backend capability, and exactly one URL for its own platform
- **AND** no platform build step contains the other platform's local URL

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
A failed attempt SHALL be retried only when its captured output proves the local XCTest
driver never reached a usable state and contains no completed assertion or assertion-failure
evidence. That proof has two shapes and both SHALL be retryable: Maestro aborting while it
creates the iOS session because the driver did not bind its port within the configured
startup timeout — which happens before the flow is opened, so that output names no flow
command and cannot be anchored on `launchApp` — or the first `launchApp`/`setPermissions`
failing because the driver was not listening or refused the connection. Unknown,
application, and assertion failures SHALL be terminal on their first occurrence.

#### Scenario: A driver startup failure is retried within the bound

- **WHEN** a flow's first `launchApp` fails during `setPermissions` with a known XCTest
  driver-not-listening or local connection-refused signature before any assertion runs
- **THEN** the harness starts a fresh Maestro process for the same flow, logs the retry reason
  and attempt number, and never exceeds the configured maximum attempts

#### Scenario: A driver that never binds its port is retried

- **WHEN** Maestro aborts before opening the flow because the iOS driver was not ready in
  time, so the attempt output carries the driver-startup timeout and no flow command at all
- **THEN** the harness classifies it as a startup failure rather than an unknown one, and
  starts a fresh Maestro process for the same flow within the configured bound

#### Scenario: A real assertion failure is never retried

- **WHEN** Maestro reports a missing element, content wait timeout, failed assertion, or any
  failure not positively classified as driver startup
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

- **WHEN** a flow selects a control that renders outside the first screenful, such as the
  Settings hub's `settings-feedback` and `settings-environment` rows
- **THEN** it reaches that control with `scrollUntilVisible` rather than a plain visibility
  wait, because the repository proof resolves ids in source and cannot observe the device
  viewport — an existing `testID` below the fold otherwise fails identically to a deleted one

#### Scenario: A known-stale selector is repaired

- **WHEN** an id listed in the proof's known-stale allowlist is reintroduced as a real `testID`
- **THEN** the proof fails until that id is removed from the allowlist
