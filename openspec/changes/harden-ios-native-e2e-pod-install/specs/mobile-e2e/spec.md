## ADDED Requirements

### Requirement: iOS native dependency installation is explicit and fail-closed

The iOS native E2E job SHALL generate the clean development native project without implicitly installing pods, SHALL run CocoaPods as an explicit observable action, and SHALL require exactly one generated `.xcworkspace` before invoking Xcode. The workflow MUST preserve `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, `EXPO_PUBLIC_API_URL=http://localhost:3005`, Release simulator configuration, and execution of every Maestro flow against the real development backend.

#### Scenario: Normal pod installation succeeds

- **WHEN** clean iOS generation succeeds and `pod install --repo-update --ansi` resolves the complete graph
- **THEN** the workflow performs no fallback, verifies exactly one workspace, builds and installs the Release simulator app, and runs the native E2E flows with the development backend capability and localhost API URL

#### Scenario: Prebuild or pod installation produces no workspace

- **WHEN** native generation or pod installation returns without exactly one `.xcworkspace`
- **THEN** the iOS job fails immediately with an explicit workspace diagnostic before any `xcodebuild`, simulator install, or Maestro command runs

#### Scenario: Multiple workspaces are ambiguous

- **WHEN** more than one generated `.xcworkspace` is present
- **THEN** the iOS job fails rather than selecting one by filesystem or alphabetical order

### Requirement: CocoaPods CDN alias fallback is narrow and bounded

The iOS pod-install action SHALL first use the normal CocoaPods trunk CDN with repository refresh. It MAY retry once without repository refresh only after the failed output proves that every actionable CocoaPods CDN error is HTTP 400 for a podspec under the exact `https://cdn.jsdelivr.net/cocoa/Specs/` alias. For each eligible path, the fallback SHALL fetch the same path from the official `CocoaPods/Specs` repository, validate JSON identity against the selected pod name and version, and seed only that path in the fresh trunk cache. It MUST NOT pin or vendor a pod, clone or replace the complete Specs source, retry an unclassified failure, or convert a failed retry into success.

#### Scenario: Diagnosed GoogleAppMeasurement alias failure recovers

- **WHEN** the first install fails only because the `GoogleAppMeasurement/12.9.0/GoogleAppMeasurement.podspec.json` CocoaPods alias returns HTTP 400 and the official same-path spec is valid
- **THEN** the helper seeds that validated spec into an initially empty isolated trunk cache, retries pod installation exactly once without `--repo-update`, and returns success only if normal CocoaPods resolution then succeeds

#### Scenario: Multiple eligible podspec aliases fail together

- **WHEN** one install reports multiple distinct HTTP-400 podspec URLs beneath the exact CocoaPods jsDelivr alias and no other actionable failure
- **THEN** the helper validates and seeds every distinct same-path official spec before performing one retry

#### Scenario: Ordinary or mixed pod failure remains terminal

- **WHEN** pod installation reports a resolver error, a non-400 response, a non-podspec URL, an unrecognized error, or an eligible alias error mixed with any other actionable failure
- **THEN** the helper returns the original failure without fetching fallback specs or retrying pod installation

#### Scenario: Unsafe fallback path is rejected

- **WHEN** a candidate URL contains traversal, a query or fragment, an unexpected host/prefix, or a path that does not end in the selected pod's `.podspec.json`
- **THEN** the helper rejects it and leaves the job failed without writing outside the isolated trunk Specs directory

#### Scenario: Fallback source or retry fails

- **WHEN** the official same-path fetch fails, its payload is invalid JSON, its declared name/version differs from the path, or the single retry fails
- **THEN** the helper propagates a non-zero result and the workflow never reaches Xcode

### Requirement: Exact-head native proof closes the infrastructure recovery

The CocoaPods infrastructure recovery SHALL not be considered complete until one GitHub Actions run for the exact implementation SHA records successful Android and iOS native E2E jobs. The jobs SHALL retain all existing flow assertions, failure artifacts, server lifecycle behavior, and development-backend build inputs.

#### Scenario: Both platforms prove the exact change head

- **WHEN** the recovery implementation is pushed and the on-demand native workflow runs for that exact commit
- **THEN** direct job evidence records `SUCCESS` for both `Run mobile E2E (Android)` and `Run mobile E2E (iOS)` before the infrastructure issue is closed and its blocked parent resumes

#### Scenario: Either platform remains red

- **WHEN** either native job fails or is cancelled on the implementation SHA
- **THEN** that run is not accepted as proof and the failure is repaired or rerun without weakening, skipping, or making any native flow optional
