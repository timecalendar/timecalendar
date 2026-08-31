## Why

Maestro 2.8.0 can fail before the first iOS flow assertion with `iOS driver not ready in time` and `LocalXCTestInstaller$IOSDriverTimeoutException`, but the E2E harness does not recognize that observed XCTest startup signature. As a result, iOS CI stops after attempt 1 even when four fresh-process startup attempts are configured, preventing the Phase 09 exact-head migration proof from using its existing bounded recovery path.

## What Changes

- Extend the positive startup-failure allowlist in `mobile/e2e/run_e2e.sh` to recognize the observed iOS driver-not-ready timeout / `IOSDriverTimeoutException` as a retryable XCTest startup failure.
- Preserve the assertion-first veto and first-attempt terminal behavior for application, assertion, and unknown failures.
- Add a fake-Maestro regression fixture using the exact observed timeout signature and prove that the configured number of fresh Maestro processes is attempted.
- Keep existing assertion and unknown-failure fixtures as single-attempt terminal proofs.
- Refresh the E2E harness documentation and Architecture Book testing wording so the documented allowlist includes the timeout signature.
- Leave `.github/workflows/ci-mobile-e2e.yml` unchanged unless implementation reveals a necessary wiring correction; its 240-second driver timeout and four-attempt invocation are already correct.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: broaden the bounded XCTest startup-retry requirement to include Maestro 2.8.0's observed iOS driver-not-ready timeout / `IOSDriverTimeoutException`, while retaining the assertion veto and default-terminal policy.

## Impact

- E2E harness: `mobile/e2e/run_e2e.sh`, `mobile/e2e/test_run_e2e.sh`, and `mobile/e2e/README.md`.
- Architecture Book: `docs/mobile/architecture-book/testing.md` receives a current-state wording update; ADR 038 remains the governing decision and does not change.
- Verification: `mobile/e2e/test_run_e2e.sh`, `mobile/e2e/test_ci_mobile_e2e.sh`, and the existing GitHub-hosted iOS E2E job provide the regression and native proof. This host has no simulator/KVM, so no local native run is claimed.
- Sensitive surfaces: no sensitive surface is expected to change. If `.github/workflows/ci-mobile-e2e.yml` proves necessary, the PR body and handoff must explicitly flag the workflow touch and verify event/ref selection, exact-head behavior, timeout/attempt wiring, permissions, and absence of unrelated CI changes.
- No API contract, generated client, database migration, native/store/EAS config, secret, Terraform, Kubernetes, or legacy Flutter change is expected.
