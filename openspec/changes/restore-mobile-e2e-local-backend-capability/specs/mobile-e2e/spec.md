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

### Requirement: Flow selectors resolve against the shipped app

Every literal selector id used by a Maestro flow SHALL correspond to a `testID` that exists in
`mobile/src`. A repository proof running in the **baseline** gate SHALL enforce this, so a UI
rework that removes a `testID` fails at the commit that causes it rather than at an on-demand
native run. Selectors deliberately written as regexes SHALL be exempt. Ids knowingly left
unresolved SHALL be enumerated in a documented allowlist carrying their follow-up ticket, and
the proof SHALL also fail when an allowlisted id becomes present, so the allowlist cannot rot.

The shared calendar-family flows SHALL reach the agenda surface through the calendar-view
header control (`calendar-view`) and the locale-stable "Agenda" entry of its menu — one
interaction shared by both platforms, with no per-platform selector or branch.

#### Scenario: A UI rework removes a testID a flow depends on

- **WHEN** a change deletes or renames a `testID` that a Maestro flow selects by literal id
- **THEN** the baseline gate fails on that change
- **AND** the failure names the flow file and the unresolved id

#### Scenario: The calendar-family flows switch to the agenda view

- **WHEN** `calendar.yaml` or `hidden-events.yaml` needs the agenda surface
- **THEN** it taps the `calendar-view` control and selects "Agenda", the same steps on Android and iOS
- **AND** `calendar.yaml` asserts the agenda list (`agenda-section-list`) mounted, which happens only in the agenda view
- **AND** the seeded-title round-trip assertions that follow are unchanged

#### Scenario: A known-stale selector is repaired

- **WHEN** an id listed in the proof's known-stale allowlist is reintroduced as a real `testID`
- **THEN** the proof fails until that id is removed from the allowlist

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
