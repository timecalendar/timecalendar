## ADDED Requirements

### Requirement: Native E2E is a conditional health signal

The native mobile E2E workflow SHALL be an informational health signal rather than an ordinary feature-merge gate. It SHALL expose exactly one daily schedule and a manual dispatch, SHALL have no push or pull-request trigger, and SHALL NOT use a label convention to run on feature-branch updates. Scheduled or manual failures SHALL preserve diagnostic evidence without blocking unrelated feature delivery.

#### Scenario: An ordinary feature pull request uses only fast gates

- **WHEN** a pull request changes mobile code, a Maestro flow, server behavior, or the OpenAPI contract
- **THEN** the native E2E workflow is not invoked by the pull request or its subsequent pushes
- **AND** the baseline workflow still runs unit, component, integration, type, lint, selector, harness, and native-workflow structure checks applicable to the change

#### Scenario: A relevant main change receives one daily platform pair

- **WHEN** the daily schedule finds at least one relevant path changed on `main` since the previous scheduled attempt
- **THEN** one Android job and one iOS job run against the same resolved `main` commit
- **AND** the result is reported as maintenance health evidence rather than required proof for an unrelated pull request

#### Scenario: A day without relevant changes skips native allocation

- **WHEN** the daily schedule finds no relevant path change since the previous scheduled attempt
- **THEN** preparation records the comparison boundary and skip reason
- **AND** the server-build, Android, and iOS jobs do not run

#### Scenario: The first scheduled attempt initializes health

- **WHEN** no earlier scheduled attempt exists for the workflow
- **THEN** the workflow runs both native platforms once against current `main`

#### Scenario: Manual diagnosis selects an immutable target

- **WHEN** manual dispatch is requested with an explicit reachable ref or SHA
- **THEN** preparation resolves it once to a commit SHA and both native platforms run against that SHA regardless of changed paths
- **AND** no pull-request label or automatic branch-update trigger is introduced

#### Scenario: Invalid manual input fails before native allocation

- **WHEN** the required manual ref or SHA cannot be resolved
- **THEN** preparation fails visibly and neither native platform job starts

#### Scenario: Native invocations do not overlap

- **WHEN** a daily or manual invocation starts while another native invocation is active
- **THEN** workflow concurrency queues it without cancelling the in-progress evidence collection

### Requirement: Scheduled change detection uses the previous attempt boundary

The scheduled controller SHALL compare current `main` with the `head_sha` of the newest preceding scheduled attempt of the same workflow, regardless of that attempt's conclusion. It SHALL use read-only Actions metadata and repository contents, SHALL run both platforms when no prior attempt exists, and SHALL NOT substitute a fixed elapsed-time window or last-success checkpoint.

Relevant paths SHALL include mobile application and Maestro flow/harness code, the OpenAPI contract, server behavior and build inputs exercised by the flows, shared E2E lifecycle/configuration, and the native workflow itself.

#### Scenario: A delayed schedule does not create a coverage gap

- **WHEN** more than 24 hours elapse between two scheduled attempts and a relevant commit lands after the earlier attempt
- **THEN** the later attempt detects that commit from the previous attempt SHA and runs both platforms

#### Scenario: A failed attempt still advances the boundary

- **WHEN** the previous scheduled attempt failed or was cancelled and no relevant commit landed afterward
- **THEN** the next scheduled attempt records no relevant change and does not automatically retry native jobs

#### Scenario: Every relevant category triggers health

- **WHEN** at least one file changes in any declared relevant category between scheduled attempt SHAs
- **THEN** the focused change detector selects both native jobs

#### Scenario: Unrelated documentation alone does not consume native runners

- **WHEN** all commits since the previous scheduled attempt touch only paths outside the declared relevant set
- **THEN** the scheduled controller skips the native job graph

## MODIFIED Requirements

### Requirement: E2E builds reach the local server

The `development` app variant SHALL be able to reach a server on the host machine over plain HTTP. Every Android and iOS native E2E prebuild and release-compilation step SHALL explicitly resolve `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and the platform-correct base URL (`http://10.0.2.2:3005` on Android, `http://localhost:3005` on iOS) via `EXPO_PUBLIC_API_URL`. Android cleartext traffic and iOS local-networking ATS exceptions SHALL remain enabled for that variant only. Focused workflow structure proof SHALL fail if any platform or build phase omits, duplicates, or misstates one of those inputs. That proof SHALL run in the baseline mobile workflow whenever the native E2E workflow or its focused tests change, because scheduled/manual native jobs do not run on ordinary pull requests.

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
- **THEN** the baseline mobile workflow executes both the workflow structure proof and harness proof
- **AND** a structural break fails the pull request without allocating an emulator or simulator

#### Scenario: The production variant carries no exceptions

- **WHEN** the app is built with `APP_VARIANT` unset or `production`
- **THEN** no cleartext or local-networking exception is present in the native config

#### Scenario: Missing capability still fails closed

- **WHEN** the backend capability is missing or malformed, including alongside a development app identity
- **THEN** the backend capability remains failed closed to production

### Requirement: CI runs Maestro on both platforms

Every selected native E2E invocation SHALL run every top-level Maestro flow on an Android emulator and an iOS simulator using release-config development-variant binaries built on the runners, with no Metro or EAS. A preparation job SHALL resolve one immutable target commit before fan-out; the server image and both platform jobs SHALL check out and identify that same commit. Both jobs SHALL install the same explicitly pinned Maestro version, print it, and preserve debug output and server logs on failure.

#### Scenario: Android e2e builds within explicit hosted-runner bounds

- **WHEN** the `e2e-mobile-android` job runs
- **THEN** it loads the selected commit's `build-server` image artifact, builds the release APK via `expo prebuild` and Gradle with a 3072 MiB heap, 1024 MiB Metaspace, at most two workers, and no persistent daemon, installs it on the hardware-accelerated emulator, and proceeds to every Maestro flow without a Metaspace OOM or orphan Gradle process

#### Scenario: iOS e2e uses isolated XCTest lifecycles

- **WHEN** the `e2e-mobile-ios` job runs on a macOS runner
- **THEN** it provisions Postgres/Redis natively, builds and installs the Release simulator app, boots the server once through native mode, and invokes every top-level flow in a fresh Maestro process so a dead driver from one flow is not reused by another

#### Scenario: CI records the selected native toolchain and target

- **WHEN** either native job installs Maestro and the iOS job selects its simulator
- **THEN** logs contain the resolved target SHA and pinned Maestro version, and iOS logs also contain the selected Xcode version/path, simulator name and UDID, and iOS runtime

#### Scenario: Failures leave evidence

- **WHEN** a native build or Maestro flow fails in a selected invocation
- **THEN** the job remains failed and uploads Maestro debug output plus server logs without introducing secrets

#### Scenario: Both platforms consume one preparation decision

- **WHEN** preparation selects a scheduled or manual invocation
- **THEN** server build, Android, and iOS depend on its `should_run` output and resolved SHA
- **AND** neither platform independently resolves a mutable branch or applies a different path condition

#### Scenario: An assertion fails while the application was never foregrounded

- **WHEN** a native attempt reports a failed assertion command, and the screen hierarchy captured for that failing step contains only system-shell nodes, with the application's own process created after the wait had already started
- **THEN** the failure SHALL be attributed to the runner rather than to the flow, the selector, the build contract, or the application, and that attribution SHALL be read from the captured hierarchy artifact — the job log reports this case identically to a real assertion failure
- **AND** the retry classifier SHALL NOT be widened to cover it, because the platform exposes no bundle attribution on hierarchy nodes and the only implementable discriminator is matching the system shell's own text, which is the signature matching this capability's structural rule replaced
- **AND** the residual platform instability SHALL be tracked separately rather than absorbed into whichever flow repair happened to surface it

### Requirement: A rename round trip proves the server converged, not just the local row

The suite SHALL carry a `user-calendar-rename.yaml` flow that renames a calendar through the UI and then proves the new name came back **from the server on a device that never performed the rename**.

The flow SHALL use its own dedicated seeded calendar (`e2e-rename-calendar`), never `e2e-smoke-calendar`: a rename is a durable server mutation, and `run_e2e.sh` runs the whole folder in one device session, so renaming the shared smoke calendar would change state under every other flow in the run.

A shared `rename-seed.yaml` preamble SHALL mirror `import-seed.yaml` for that token — leading `launchApp: clearState: true`, `stopApp`, `openLink` the dev-import deep link, the optional iOS "Open" tap, and an `extendedWaitUntil` on the post-import navigation.

The flow SHALL:

1. run `rename-seed.yaml`, then cold-start into `timecalendar-dev://user-calendars`;
2. assert the seeded **baseline** name is visible;
3. open that row's overflow menu by `id: user-calendar-actions-<seeded id>` (never by text — the trigger is a `Pressable` whose composed `accessibilityLabel` collapses the child text on iOS), choose Rename, enter the target name, and save by `id: user-calendar-rename-save`;
4. assert the new name is visible on the list (the local write);
5. run `rename-seed.yaml` **again**, whose `clearState` wipes the device and whose re-import resolves the token from the server, then cold-start into `timecalendar-dev://user-calendars`;
6. assert the **renamed** name is visible — a row whose name can only have come from the server.

The flow SHALL NOT use `- back` (iOS reports it COMPLETED without popping); re-entry SHALL use the suite's `stopApp` → `launchApp` → `extendedWaitUntil` idiom. Every `extendedWaitUntil` whose preceding top-level command is `launchApp` or `openLink` SHALL carry `timeout: 60000`. The dialog's title string and its Save control SHALL be distinguishable from the menu's "Rename" action, so no two live elements share one anchored selector.

The flow SHALL be cross-platform (no per-platform selector fork beyond the existing optional iOS "Open" tap) and SHALL run under the existing `run_e2e.sh` folder run. It is native-health work: its pull request SHALL rely on baseline selector/harness/structure gates and SHALL NOT require emulator execution to merge; it is exercised by the next relevant scheduled health run or a deliberate manual dispatch.

`mobile/e2e/README.md` SHALL record that step 2's baseline assertion requires a freshly seeded server — CI re-seeds every run, but a local re-run without re-running the seed will fail there because the calendar is already renamed.

#### Scenario: The rename flow round-trips through the server

- **WHEN** `user-calendar-rename.yaml` runs against the seeded server
- **THEN** the baseline name is asserted, the rename is performed through the overflow menu and the controlled dialog, and after a state-clearing re-import the renamed name is asserted on a freshly imported row

#### Scenario: The rename flow leaves the smoke calendar untouched

- **WHEN** the full folder run executes
- **THEN** `user-calendar-rename.yaml` mutates only `e2e-rename-calendar`, and every other flow's assertions against `e2e-smoke-calendar` are unaffected

## REMOVED Requirements

### Requirement: Main CI supplies terminal native proof

**Reason**: Native E2E is now a conditional scheduled/manual health signal and no longer supplies mandatory per-commit or recovery close-out proof.

**Migration**: Use the fast baseline workflow as the pull-request gate. Observe the next relevant daily run for ongoing cross-platform health, or manually dispatch an explicit ref/SHA when E2E-focused work or diagnosis warrants native evidence.
