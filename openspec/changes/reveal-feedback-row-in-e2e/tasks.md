## 1. Encode the Feedback flow regression

- [x] 1.1 Extend `mobile/e2e/test_run_e2e.sh` (or add one equivalently focused shell proof
      under `mobile/e2e/`) to assert that `feedback.yaml` contains a bounded
      `scrollUntilVisible` for `settings-feedback`, uses `direction: DOWN` and
      `timeout: 60000`, orders reveal before the existing visibility wait and selector tap,
      and retains the Feedback title, empty submit, and both validation assertions; run it
      against the pre-repair flow and record the expected failure before changing the YAML.
- [x] 1.2 In `mobile/.maestro/feedback.yaml`, insert the bounded downward reveal immediately
      after tapping Settings and before the existing `extendedWaitUntil`; keep the existing
      wait, selector tap, navigation, empty-form submit, and validation tail unchanged, then
      rerun the focused proof to green.

## 2. Verify formatting and harness behavior

- [x] 2.1 Run `cd mobile && npx prettier --check .maestro/feedback.yaml` and inspect the
      parsed/indented command block to confirm the selector, direction, timeout, and command
      nesting are valid Maestro YAML.
- [x] 2.2 Run `bash -n mobile/e2e/run_e2e.sh mobile/e2e/test_run_e2e.sh` and
      `mobile/e2e/test_run_e2e.sh`; confirm the existing lexical enumeration, single server
      lifecycle, retry classification, terminal-failure behavior, and new Feedback structure
      proof all pass without changing runtime harness semantics.

## 3. Reconcile documentation and scope

- [x] 3.1 Re-read `docs/mobile/architecture-book/testing.md`, `navigation.md`, ADR 038, and
      `definition-of-done.md` against the applied diff and record the Architecture Book/ADR
      update as N/A in the PR/handoff: this leaf repair applies the existing bounded Maestro
      and CI-only native-proof rules and changes no reusable current-state contract.
- [x] 3.2 Audit the final diff and confirm it contains only this OpenSpec change, the Feedback
      Maestro flow, and focused E2E proof coverage; confirm application/UI source, PR #273's
      environment-switch repair, workflows, API/generated contract, migrations,
      native/store/EAS/Firebase config, deployment infrastructure, and legacy Flutter remain
      untouched.

## 4. Local green and exact-head CI proof

- [x] 4.1 Run `openspec validate reveal-feedback-row-in-e2e` and confirm every modified
      `mobile-feedback` scenario is covered by the implementation and focused proof.
- [ ] 4.2 Push the implementation to the existing recovery branch/PR, preserve its draft
      pipeline stage markers, and trigger the ticket-required native E2E jobs without editing
      `.github/workflows/ci-mobile-e2e.yml` or adding a QA gate.
- [ ] 4.3 Record baseline, `e2e-mobile-android`, and `e2e-mobile-ios` results with the tested
      PR head SHA. Reviewer MUST compare that SHA with the current recovery PR head immediately
      before merge and obtain a fresh full exact-head gate after any later commit.
