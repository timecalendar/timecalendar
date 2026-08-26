## Why

The first `main` run containing the SDK 56 onboarding merge cannot complete the binding
Phase 01 step 5 gate: Android exhausts Gradle Metaspace while assembling the release-config
development APK, and iOS loses Maestro's shared XCTest driver before any app assertion can
run. The CI harness must become bounded and reproducible so both platforms can prove the full
Maestro suite on the merged application.

## What Changes

- Pin Maestro 2.8.0 in both native E2E jobs, print its exact version, and log the selected
  Xcode, simulator device, and iOS runtime.
- Bound the Android Gradle release build's heap, Metaspace, worker count, and daemon lifetime
  for the GitHub-hosted runner so an OOM cannot leave the job alive until timeout.
- Run every top-level Maestro YAML in its own CLI process while keeping one shared
  `ci/e2e-server.sh` lifecycle, so an iOS 26 XCTest driver death cannot poison later flows.
- Allow only bounded, signature-gated retries for failures that happen while the XCTest
  driver is starting; assertion and other flow failures fail immediately and are never
  converted into a pass by retrying the suite.
- Update the E2E README, agent environment handbook, Architecture Book testing rule, and a
  new ADR to match the final harness contract and its upstream-driven revisit condition.
- Require post-merge `main` proof from both native jobs, including the onboarding flow, before
  the recovery issue is closed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: make native CI builds and Maestro execution bounded, reproducible, isolated
  per flow, and strict about which infrastructure failures are retryable.

## Impact

- `.github/workflows/ci-mobile-e2e.yml` — sensitive CI surface; Maestro installation,
  Android Gradle limits, iOS simulator metadata, and harness invocation change. The workflow
  remains non-deploying and Reviewer auto-merge eligible.
- `mobile/e2e/run_e2e.sh` — invocation and failure-propagation contract changes; the shared
  server lifecycle remains single-sourced and is started only once per full run.
- `mobile/e2e/README.md`, `docs/agent-dev-environment.md`,
  `docs/mobile/architecture-book/testing.md`, and
  `docs/mobile/architecture-book/decisions/` — operator and binding-rule documentation.
- No product behavior, Maestro flow assertions, OpenAPI/generated client, server schema,
  native/store/EAS configuration, deploy workflow, infrastructure, or legacy Flutter change.
  No secrets or human-only steps are introduced.
