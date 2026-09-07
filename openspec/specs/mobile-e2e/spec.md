# mobile-e2e Specification

## Purpose

TBD - created by archiving change add-mobile-test-harness. Update Purpose after archive.
## Requirements
### Requirement: Native E2E is a conditional health signal

The native mobile E2E workflow SHALL be an informational health signal rather than an ordinary feature-merge gate. It SHALL expose exactly one daily schedule and a manual dispatch, SHALL have no push or pull-request trigger, and SHALL NOT use a label convention to run on feature-branch updates. Scheduled or manual failures SHALL preserve diagnostic evidence without blocking unrelated feature delivery.

#### Scenario: An ordinary feature pull request uses only fast gates

- **WHEN** a pull request changes mobile code, a Maestro flow, server behavior, or the OpenAPI contract
- **THEN** the native E2E workflow is not invoked
- **AND** the baseline workflow still runs applicable unit, component, integration, type, lint, selector, harness, and workflow-structure checks

#### Scenario: A relevant main change receives one daily platform pair

- **WHEN** the daily schedule finds a relevant path changed on `main` since the preceding scheduled attempt
- **THEN** one Android job and one iOS job run against the same resolved `main` commit

#### Scenario: Manual diagnosis selects an immutable target

- **WHEN** manual dispatch supplies a reachable ref or SHA
- **THEN** preparation resolves it once and both native platforms run against that SHA regardless of changed paths
- **AND** invalid input fails before native allocation

#### Scenario: Native invocations do not overlap

- **WHEN** a daily or manual invocation starts while another is active
- **THEN** workflow concurrency queues it without cancelling the in-progress evidence collection

### Requirement: Scheduled change detection uses the previous attempt boundary

The scheduled controller SHALL compare current `main` with the `head_sha` of the newest preceding scheduled attempt of the same workflow, regardless of conclusion. It SHALL use read-only Actions metadata and repository contents, run both platforms when no prior attempt exists, and SHALL NOT substitute a fixed elapsed-time window or last-success checkpoint. Relevant paths SHALL cover `mobile/**`, `openapi/**`, `server/**`, the shared E2E lifecycle and dummy-key generator, `.nvmrc`, and the native workflow itself.

#### Scenario: A day without relevant changes skips native allocation

- **WHEN** no relevant path changed since the preceding scheduled attempt
- **THEN** preparation records the boundary and skip reason
- **AND** the server-build, Android, and iOS jobs do not run

#### Scenario: An unusable comparison fails visibly

- **WHEN** the preceding attempt SHA cannot be compared with current `main`
- **THEN** preparation fails rather than silently reporting no changes

### Requirement: Real-round-trip Maestro flow

The three mobile Maestro journeys SHALL exercise real persistence and, where applicable, the harness-managed NestJS/Postgres backend with nothing mocked. The fresh-user import SHALL use the live schools read and a harness-served deterministic iCalendar source; the visibility journey SHALL use a real held seeded subscription; the personal-event journey SHALL use the real device-local database. Flows and nested helpers SHALL remain shared across platforms, use stable seeded/localized selectors, and preserve the cold-start `stopApp` → `openLink` idiom with bounded waits.

#### Scenario: Seeded schools and imported events render through the real stack

- **WHEN** the fresh-user flow reads the seeded school, submits the harness iCalendar fixture, and reaches the calendar
- **THEN** the generated client, `customFetch`, NestJS, Postgres, calendar sync, and local persistence produce the rendered fixture event and resolvable details

#### Scenario: Local persisted mutations render after restart

- **WHEN** the personal-event and subscribed-calendar journeys cold-reopen without clearing state after their writes
- **THEN** rendered Home/Calendar state reflects the canonical persisted values rather than only optimistic UI

### Requirement: The rewritten flows stay cross-platform and cold-start-idiomatic

The retained business flows and their nested helpers SHALL remain shared across iOS and Android, using localized/seeded text and platform-neutral testIDs with no selector fork beyond the optional iOS custom-scheme confirmation. They SHALL use the established state-preserving cold-reentry idiom and bounded waits around app readiness and first synced-data assertions.

#### Scenario: A retained journey runs unchanged on both platforms

- **WHEN** any retained top-level flow runs on the iOS simulator and Android emulator
- **THEN** both execute the same business interactions and assertions, with only the existing optional iOS deep-link confirmation branch

### Requirement: Single-command local e2e run

The repository SHALL provide one command that boots the server stack once, discovers exactly the three top-level Maestro YAML journeys, runs each against the connected simulator/emulator in a separate Maestro CLI process, reports pass/fail, and tears the stack down once including on failure. Nested helper YAML SHALL run only when invoked by a top-level journey. The `--keep-up` debugging escape hatch SHALL remain available.

#### Scenario: One command runs the isolated smoke pack

- **WHEN** `mobile/e2e/run_e2e.sh` runs with an installed E2E build and connected device
- **THEN** it brings the shared server lifecycle up once, invokes one Maestro process for each of the three top-level journeys in lexical order, exits with the first terminal non-zero status or zero after all pass, and tears down once

#### Scenario: Helpers are not independently executed

- **WHEN** reusable setup YAML exists below a nested helper directory
- **THEN** top-level discovery excludes it while retained flows can invoke it with `runFlow`

#### Scenario: --keep-up leaves the stack for debugging

- **WHEN** the wrapper runs with `--keep-up`
- **THEN** the server stack remains up and the command reports how to inspect logs and tear it down manually

### Requirement: E2E builds reach the local server

The `development` app variant SHALL be able to reach a server on the host machine over plain HTTP. Every Android and iOS native E2E prebuild and release-compilation step SHALL explicitly resolve `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and the platform-correct base URL (`http://10.0.2.2:3005` on Android, `http://localhost:3005` on iOS) via `EXPO_PUBLIC_API_URL`. Android cleartext traffic and iOS local-networking ATS exceptions SHALL remain enabled for that variant only. Focused workflow structure proof SHALL fail if any platform or build phase omits, duplicates, or misstates one of those inputs. The baseline mobile workflow SHALL watch the native workflow and invoke both workflow-structure and harness proof because native jobs do not run on ordinary pull requests.

#### Scenario: A release-config dev-variant build calls the harness server

- **WHEN** a release-configuration build explicitly compiles the development identity and backend capability on an emulator/simulator while the harness server listens on host port 3005
- **THEN** the runtime selects `local` and the app's HTTP request reaches the server through the platform-correct URL without Metro running
- **AND** Android cleartext policy or iOS ATS does not block the request

#### Scenario: Every native build phase carries the complete contract

- **WHEN** the focused workflow structure proof inspects Android prebuild, Android release assembly, iOS prebuild, and iOS Release simulator build
- **THEN** each step contains exactly one development identity, exactly one development backend capability, and exactly one URL for its own platform
- **AND** no platform build step contains the other platform's local URL

#### Scenario: A change to the native E2E workflow alone is still gated

- **WHEN** a pull request modifies only the native E2E workflow file
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

Every selected native E2E invocation SHALL run every top-level Maestro flow on an Android emulator and an iOS simulator using release-config development-variant binaries built on the runners, with no Metro or EAS. Preparation SHALL resolve one immutable target before fan-out; the server image and both platform jobs SHALL check out and identify that SHA. Both jobs SHALL install the same explicitly pinned Maestro version, print it, and preserve debug output and server logs on failure.

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

#### Scenario: Both platforms consume one preparation decision

- **WHEN** preparation selects a scheduled or manual invocation
- **THEN** server build, Android, and iOS depend on its `should_run` output and resolved SHA
- **AND** neither platform independently resolves a mutable branch or applies a different path condition

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

### Requirement: Static E2E integrity remains a baseline gate

Baseline CI SHALL recursively inspect retained top-level flows and nested helpers, fail any `id:` selector that resolves to no shipped `testID`, reject platform-asymmetric bare `back`, and retain the structural retry-classifier and shell-harness fixtures. The guards SHALL be updated to refer to the new journey/helper paths without weakening their matching behavior.

#### Scenario: A retained selector drifts

- **WHEN** a retained flow or helper references a removed or renamed shipped `testID`
- **THEN** the baseline selector proof names the YAML location and fails before native execution

#### Scenario: Harness recovery logic changes

- **WHEN** retry classification, process isolation, or top-level discovery changes
- **THEN** the existing mutation-backed shell/Jest fixtures fail unless the structural contract remains satisfied
