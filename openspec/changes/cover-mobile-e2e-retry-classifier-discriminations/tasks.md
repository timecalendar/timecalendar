## 1. Add orthogonal retryable fixtures

- [x] 1.1 In `make_fixture`, add a minimal assertion-family scenario whose first alpha attempt records a same-depth restart boundary, `assertConditionCommand:PENDING`, and a trailing `applyConfigurationCommand:RUNNING`, then exits non-zero; make its retry succeed and add one `retryable_case` line.
- [x] 1.2 Add a minimal startup-membership scenario whose first alpha attempt contains only startup-phase commands, ends in `runFlowCommand:RUNNING`, has no evaluated assertion, and exits non-zero; make its retry succeed and add one `retryable_case` line.
- [x] 1.3 Add a minimal restart-boundary scenario whose first alpha attempt records an evaluated assertion before a same-depth `openLinkCommand:RUNNING`, with nothing evaluated after that boundary, then exits non-zero; make its retry succeed and add one `retryable_case` line distinct from `completed_assertion_before_restart`.
- [x] 1.4 Add the exact `empty_command_record` branch from the issue: on alpha attempt one call `emit_commands` with no arguments and exit 59, otherwise emit the normal successful record and exit zero.
- [x] 1.5 Immediately after `session_never_opened_flow` and its `no command record` grep, add `retryable_case empty_command_record 'a parseable record with zero commands'` followed by an exact grep for `0 command(s) recorded, last=none status=none`; do not insert any other retryable case between a scenario and its fixture-specific assertion.

## 2. Prove each classifier branch independently

- [x] 2.1 Capture the first-attempt command record for each new scenario, generate disposable classifier copies under `TEST_ROOT` for exactly these mutations: `isAssertionCommand` always false, `runFlowCommand` removed only from `STARTUP_PHASE_COMMANDS`, `openLinkCommand` removed only from `RESTART_BOUNDARY_COMMANDS`, and the explicit empty-list branch forced false.
- [x] 2.2 Replay all four records against all four mutants and assert the isolation matrix: each fixture is terminal only for its named mutation and remains retryable for the other three mutations; emit a focused failure message naming the fixture and mutation for any unexpected verdict.
- [x] 2.3 Preserve all existing positive, terminal, malformed-record, malformed-command-entry, and mutation proofs unchanged in meaning; confirm the unmodified classifier still makes the complete harness print `[test_run_e2e] PASS`.

## 3. Confirm architecture and scope

- [x] 3.1 Review ADR 038 and `docs/mobile/architecture-book/testing.md` against the implemented fixtures; because classifier behavior and the documented contract do not change, record in the handoff that no Architecture Book, changelog, or ADR edit is required.
- [x] 3.2 Inspect the implementation diff and confirm the only changed implementation path is `mobile/e2e/test_run_e2e.sh`; do not modify `mobile/e2e/classify-maestro-attempt.mjs`, workflow files, native/store config, the `run-e2e` label, API/generated code, migrations, infrastructure, or legacy Flutter.

## 4. Verify locally and in CI

- [x] 4.1 Run `bash -n mobile/e2e/test_run_e2e.sh` and `./mobile/e2e/test_run_e2e.sh`; record the four-row mutation result as baseline PASS and each named mutation CAUGHT, with the existing malformed-command-entry proof still CAUGHT.
- [x] 4.2 Run `./mobile/e2e/test_ci_mobile_e2e.sh` to confirm the existing baseline CI job still invokes the focused proof and the native workflow contract remains unchanged.
- [ ] 4.3 Run the repository Prettier check covering the edited harness (`cd mobile && npx prettier --check e2e/test_run_e2e.sh`), `openspec validate cover-mobile-e2e-retry-classifier-discriminations`, and `git diff --check`.
- [ ] 4.4 Use the standard PR CI run on the exact implementation head as the CI proof test; do not add the native `run-e2e` label or claim simulator/device execution for this shell-only coverage change.
- [ ] 4.5 Post the final baseline/mutation matrix and verification commands on [TIM-284](/TIM/issues/TIM-284) as completion evidence for downstream review.
