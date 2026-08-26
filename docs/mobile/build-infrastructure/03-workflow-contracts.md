# 3 — Workflow contracts

These are implementation contracts, not workflow files. Names are recommendations; implementation
is a later issue because this issue is docs-only.

## 3.1 `mobile-e2e`

This contract has two trust domains. The existing public-repository workflow retains hosted PR,
Android and fallback jobs. A private orchestration repository owns the Mac-backed iOS job and
reports its result against the public commit SHA. The public repository never exposes a self-hosted
runner label.

### Triggers

- a scoped dispatch to the private repository after `push` to public `main` when `mobile/**` or
  `openapi/**` changes;
- existing labelled-PR behavior remains entirely on GitHub-hosted runners;
- private `workflow_dispatch` for a trusted SHA;
- public `workflow_dispatch` for the hosted fallback.

For a Mac job, "trusted SHA" means the resolved commit is already an ancestor of `origin/main`.
An unmerged pull-request SHA may use the existing hosted runners, never the persistent Mac.

### Inputs

| Input        | Values                                     | Default            |
| ------------ | ------------------------------------------ | ------------------ |
| `ref`        | branch, tag or full SHA in this repository | current `main` SHA |
| `platform`   | `ios`, `android`, `both`                   | `both`             |
| `ios_runner` | `mac-mini`, `github-hosted`                | `mac-mini`         |
| `suite`      | named suite such as `smoke` or `full`      | `full`             |

No free-text command input.

### Jobs

1. **Resolve** in the private workflow on hosted Linux: normalize SHA, verify public repository
   origin and `main` ancestry for Mac jobs, then write the summary.
2. **Static checks** on hosted Linux: reuse existing mobile CI status for the SHA; do not duplicate
   a known-green job unnecessarily.
3. **Android** on hosted Linux during the pilot: current release-config dev variant + emulator +
   `mobile/e2e/run_e2e.sh`.
4. **iOS** in one of two separate jobs: the private workflow uses the Mac; the public fallback uses
   GitHub-hosted macOS. PR events can reach only the hosted job.
5. **Evidence**: always upload JUnit/Maestro output, timings, selected runtime/tool versions and
   server logs on failure; publish a check/status against the public SHA from a narrowly scoped
   integration identity.

### Result contract

The check summary records:

- resolved SHA;
- runner name and runner version;
- macOS/Xcode, Node, JDK, CocoaPods and Maestro versions;
- cache hit/miss category, without dumping paths containing credentials;
- native build time, simulator boot/install time and flow time separately;
- test verdict and artifact links.

## 3.2 `mobile-internal-build`

This is the CEO's requested "give internal testers a SHA" flow.

### Important profile correction

The current `preview` profile is `distribution: internal`: it produces an ad hoc iOS IPA and an
Android APK. That is useful for direct installation, but it is **not** a TestFlight-internal or Play
internal-track build.

A later implementation needs a store-distributed internal profile (provisional name:
`internal-store`) with:

- production bundle/package identity;
- `distribution: store`;
- `preview` OTA channel;
- AAB on Android and store IPA on iOS;
- remote auto-incremented build numbers;
- submit configuration naming the TestFlight internal group(s) and targeting Play internal testing.

Do not silently repurpose the existing `preview` profile; retain it for direct/ad hoc installs or
rename it in a deliberate ADR-backed config change.

### Inputs

| Input           | Values                      | Default                    |
| --------------- | --------------------------- | -------------------------- |
| `ref`           | repository ref or SHA       | current `main` SHA         |
| `platform`      | `ios`, `android`, `both`    | `both`                     |
| `audience`      | `internal` only             | `internal`                 |
| `submit`        | `false`, `true`             | `false`                    |
| `release_notes` | short text shown to testers | commit subject + short SHA |

### Flow

1. Resolve and record immutable SHA.
2. Require the normal mobile CI checks for that SHA.
3. Ask EAS Build for the store-distributed internal profile.
4. Record EAS build IDs, fingerprints, versions and artifact links.
5. If `submit=false`, stop successfully with downloadable build evidence.
6. If `submit=true`, wait at GitHub environment `mobile-internal-submit`.
7. After approval, submit those exact EAS build IDs to the named TestFlight internal group(s) and
   Play internal track. Expo supports `groups` in the iOS submit profile/CLI; do not rely on a human
   to attach the build after upload.
8. Record App Store Connect/Play processing links and tester-facing release notes.

Uploading to internal testers is a deploy act. Automation may prepare it; the existing human release
gate authorizes it.

## 3.3 `mobile-beta-build`

Use the beta population described in [OTA document 7](../ota/07-environments-and-testing.md).

- exact SHA required;
- EAS store build with a future `beta` profile and `beta` OTA channel;
- TestFlight external / Play closed testing destination;
- protected `mobile-beta-submit` environment before submission;
- first TestFlight build of a version may require Beta App Review;
- submit the existing build IDs, never rebuild after approval.

## 3.4 `mobile-production-build`

Production is deliberately stricter:

| Requirement | Rule                                                          |
| ----------- | ------------------------------------------------------------- |
| Source      | protected release tag resolving to a commit on `main`         |
| Checks      | all required CI plus explicit Phase 10 parity evidence        |
| Build       | EAS `production`, both platforms, no Mac signing              |
| Approval    | protected `mobile-production-submit`, no self-approval        |
| Submission  | exact EAS build IDs approved above                            |
| Rollout     | staged in the stores; separate from merge and build           |
| Record      | SHA, tag, app versions, Expo fingerprints, EAS IDs, store IDs |

Build and upload may be one workflow, but they remain separate jobs so credentials are unavailable
before approval.

## 3.5 Development builds

Development-client and simulator builds are not store deliveries. A trusted manual job may build
and retain a development artifact on the Mac or upload it as a short-lived GitHub artifact. It must
not use production signing or submit anywhere.

For day-to-day feature development, Metro remains faster than any CI-produced build. Rebuild a
development client only when native dependencies, plugins or configuration change its fingerprint.

## 3.6 Paperclip and future QA use

A Paperclip agent with access to the private orchestration repository uses the same narrow interface
as a human:

1. identify the exact commit from its assigned issue;
2. dispatch the approved workflow and named suite;
3. read the GitHub check, logs and artifacts;
4. attach the result to its own issue;
5. return failures to the Applier with the exact SHA and evidence.

It does not SSH to the Mac, install tools, edit runner state or retrieve store credentials.

Current board policy has no QA Engineer and no `QA: required` gate. The workflow must be usable by a
future QA role, but the adoption plan does not create or depend on that role.

## 3.7 Failure behavior

- **Mac offline:** dispatch the same SHA with `ios_runner=github-hosted`; investigate the Mac later.
- **Cache suspected:** retry once with a documented clean-cache mode; a pass after cleaning is a
  cache-integrity incident, not evidence the original failure was flaky.
- **E2E assertion failure:** fail; do not automatically retry assertions.
- **Known Maestro transport-start failure:** preserve the repository's narrowly classified startup
  retry only.
- **EAS build failure:** no submit job receives credentials or approval.
- **Store processing failure:** retain the build ID and report the store error; do not rebuild unless
  the binary itself must change.
- **Requested SHA deleted/unreachable:** fail resolution; never fall back silently to `main`.

## 3.8 Store facts behind the contract

- Apple allows up to 100 App Store Connect users as TestFlight internal testers; builds last 90
  days. External testing can include up to 10,000 people and may require beta review.
- Google Play internal testing supports up to 100 testers and normally makes an AAB available within
  minutes.
- A Play tester eligible for multiple tracks receives the highest compatible version code, so build
  numbering must remain centrally monotonic.

Sources: [Apple TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview),
[Apple internal testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/),
[Google Play testing tracks](https://support.google.com/googleplay/android-developer/answer/9845334),
[Expo Android submission](https://docs.expo.dev/submit/android/).
