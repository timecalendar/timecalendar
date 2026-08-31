## 1. Extend the bounded startup classifier

- [ ] 1.1 Update `mobile/e2e/run_e2e.sh` so `is_retryable_startup_failure` retains its assertion-first veto, preserves the existing `launchApp|setPermissions` plus driver-not-listening/connection-refused branch, and adds a case-insensitive positive branch for the explicit `iOS driver not ready in time` / `IOSDriverTimeoutException` markers; do not match generic timeout text.
- [ ] 1.2 Review the classifier diff against ADR 038 and confirm application, assertion, content-timeout, and unknown output still default to terminal while retry exhaustion returns Maestro's original non-zero status.

## 2. Add deterministic regression fixtures

- [ ] 2.1 Extend the fake `maestro` scenarios in `mobile/e2e/test_run_e2e.sh` with the exact observed two-line `iOS driver not ready in time` and `LocalXCTestInstaller$IOSDriverTimeoutException` output.
- [ ] 2.2 Run that scenario with `--startup-attempts 4` and assert four fresh invocations of the first flow, zero invocations of the later flow, the original failing exit code, one backend-log call, and one teardown.
- [ ] 2.3 Add an explicit unknown-failure scenario and assert it runs the first flow exactly once with `--startup-attempts 4`, skips later flows, preserves its exit code, dumps backend logs once, and tears down once; retain the existing assertion fixture as the same single-attempt terminal proof.
- [ ] 2.4 Add or refine a mixed assertion-plus-startup-marker fixture if needed to directly prove the assertion-first veto from the modified spec; assert one attempt only.

## 3. Keep current-state documentation accurate

- [ ] 3.1 Update `mobile/e2e/README.md` so its pinned Maestro 2.8.0 retry-signature list includes the explicit iOS driver-not-ready timeout / `IOSDriverTimeoutException`, while stating that assertion, application, content-timeout, and unknown failures remain terminal.
- [ ] 3.2 Update the Maestro E2E rule in `docs/mobile/architecture-book/testing.md` with the same current-state signature wording and retain ADR 038 as the governing decision; no new ADR or Architecture Book changelog entry is needed because the retry policy is unchanged.

## 4. Verify locally and protect CI wiring

- [ ] 4.1 Run `./mobile/e2e/test_run_e2e.sh` and confirm every retry, exhaustion, assertion-veto, and unknown-terminal fixture passes.
- [ ] 4.2 Run `./mobile/e2e/test_ci_mobile_e2e.sh` and confirm the workflow still pins Maestro 2.8.0, runs both shell proofs, and invokes `./mobile/e2e/run_e2e.sh --native --startup-attempts 4`.
- [ ] 4.3 Run `openspec validate recognize-maestro-ios-driver-timeout` and resolve every validation error.
- [ ] 4.4 Inspect `git diff --check` and the final changed-path list; confirm no API contract, generated client, migration, native/store/EAS config, secret, infrastructure, or legacy Flutter surface changed.
- [ ] 4.5 Do not edit `.github/workflows/ci-mobile-e2e.yml` unless a concrete wiring defect is found. If it is touched, explicitly flag the sensitive workflow surface in the PR body and verify event/ref selection, exact-head preservation, timeout/attempt wiring, permissions, and absence of unrelated CI behavior changes.

## 5. CI proof and handoff evidence

- [ ] 5.1 Ensure standard PR CI runs the deterministic shell regression and is green; this is the CI proof test for the classifier/control-flow repair.
- [ ] 5.2 Record that this host cannot run a simulator/emulator and do not claim local native proof; use the existing GitHub-hosted iOS E2E path for native verification without weakening assertions or changing the Phase 09 exact head.
