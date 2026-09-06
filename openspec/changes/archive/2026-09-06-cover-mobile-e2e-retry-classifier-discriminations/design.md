## Context

ADR 038 defines a structural classifier for bounded Maestro startup retries. The focused shell harness already proves broad positive and negative behavior, but four independent implementation branches can be removed without a fixture uniquely identifying the regression: assertion-family recognition, `runFlowCommand` membership in `STARTUP_PHASE_COMMANDS`, `openLinkCommand` membership in `RESTART_BOUNDARY_COMMANDS`, and the explicit `commands.length === 0` return.

The corrected brief intentionally excludes two non-discriminating ideas. A completed assertion cannot isolate assertion-family recognition under the current decision order, and removing `FAILED` from `EVALUATED_STATUSES` produces no different verdict for a valid command list because other guards decide first.

Constraints:

- Change only `mobile/e2e/test_run_e2e.sh` during implementation; do not edit the classifier.
- Keep fixtures compatible with macOS Bash 3.2 and the existing fake-Maestro record format.
- Use deterministic shell and Node checks; no simulator, emulator, native workflow label, or device cycle is needed.
- Preserve the existing classifier contract, ADR, Architecture Book wording, and CI wiring.

## Goals / Non-Goals

**Goals:**

- Give each of the four distinguishable classifier branches one minimal retryable fixture.
- Prove each new fixture changes verdict only under its named mutation among the four listed mutations.
- Distinguish an empty but parseable record from the existing missing-record path.
- Keep the complete focused harness and its existing malformed-entry mutation green.

**Non-Goals:**

- Change retry classification, attempt limits, process lifecycle, or production behavior.
- Add coverage for the rejected completed-assertion or evaluated-`FAILED` mutations.
- Modify the classifier, workflow files, documentation, native configuration, or the `run-e2e` label.

## Decision 1 — Use four orthogonal minimal command records

Each fixture will have a single reason to flip under its named mutation:

| Fixture contract | First-attempt record | Named mutation | Expected mutated verdict |
| --- | --- | --- | --- |
| Assertion-family recognition | A same-depth launch boundary, `assertConditionCommand:PENDING`, then `applyConfigurationCommand:RUNNING` | Force `isAssertionCommand` to return `false` | Terminal |
| `runFlowCommand` startup membership | Startup-only commands ending in `runFlowCommand:RUNNING`, with no assertion | Remove `runFlowCommand` from `STARTUP_PHASE_COMMANDS` | Terminal |
| `openLinkCommand` restart-boundary membership | An evaluated assertion followed by same-depth `openLinkCommand:RUNNING`, with no evaluated command after it | Remove `openLinkCommand` from `RESTART_BOUNDARY_COMMANDS` | Terminal |
| Empty command record | A real `commands.json` containing `[]` | Force the explicit empty-list branch to return `false` | Terminal |

Every record is retryable with the unmodified classifier. The assertion fixture deliberately ends in `applyConfigurationCommand`, not `runFlowCommand`, and uses a launch boundary rather than `openLinkCommand`; this prevents the other membership mutations from deciding its verdict. The startup-membership fixture contains no assertion and retains another restart boundary. The boundary fixture keeps `openLinkCommand` in the startup set when only its boundary membership is mutated, so the earlier evaluated assertion is the deciding evidence. The empty fixture contains no commands for any set or assertion mutation to inspect.

Alternatives considered:

- Use a `COMPLETED` assertion for assertion recognition: rejected because it cannot produce the requested differential under the current guard order.
- Remove `FAILED` from `EVALUATED_STATUSES`: rejected because the global failure and final-command guards make that mutation behaviorally redundant for valid records.
- Reuse `completed_assertion_before_restart` for the open-link mutation: rejected because its existing mutation proves removal of the entire epoch slice, not `openLinkCommand` membership itself.

## Decision 2 — Assert the full fixture-by-mutation isolation matrix

The harness will capture the first-attempt `commands.json` for each new scenario, generate four classifier copies containing exactly one named mutation apiece, and replay every new record against every mutant. The expected matrix has one terminal result per fixture: the diagonal named mutation. All off-diagonal combinations remain retryable.

This matrix proves both sides of the contract: every named branch is load-bearing, and no fixture accidentally depends on another listed branch. The existing malformed-command-entry mutation remains in the suite as a separate caught regression, and the unmodified end-to-end cases remain the baseline pass.

Alternatives considered:

- Check only each fixture against its named mutant: rejected because it would not prove the brief's isolation requirement.
- Edit the classifier in place and restore it between checks: rejected because it risks changing the production file and makes failures less local; generated copies under the harness temp root are disposable and deterministic.

## Decision 3 — Anchor the empty-record diagnostic next to the missing-record proof

The empty-record fixture will use the exact first-attempt branch from the brief: call `emit_commands` with no arguments for alpha attempt one, exit 59, then succeed normally on retry. Its `retryable_case` and the exact diagnostic assertion `0 command(s) recorded, last=none status=none` will be placed immediately after `session_never_opened_flow` and that scenario's `no command record` assertion.

This ordering is load-bearing because `retryable_case` intentionally writes the global `fixture`. Keeping each scenario-specific grep adjacent ensures the missing-record assertion reads the missing-record fixture and the empty-record assertion reads the empty-record fixture.

Alternatives considered:

- Treat absence of `commands.json` as sufficient empty coverage: rejected because the caller handles a missing file without invoking the classifier.
- Assert only that the empty scenario retried: rejected because it would not prove the parseable empty record reached the classifier.

## Risks / Trade-offs

- **A broad text replacement mutates both startup and restart sets** → Generate each mutant with a scoped replacement and validate the complete isolation matrix.
- **A new retry case repoints the global fixture before an existing scenario-specific assertion** → Keep each `retryable_case` adjacent to its own output assertion, especially the missing and empty record pair.
- **Synthetic records become larger than necessary and overlap other guards** → Use only the commands needed to establish the boundary, target discriminator, and startup final command.
- **Harness-only coverage could be mistaken for native proof** → Record local shell evidence and standard CI only; do not add the native E2E label or claim a device run.

## Migration Plan

1. Add the four fake-Maestro branches and their retryable cases in the existing harness.
2. Capture their first-attempt records and add the four-mutant isolation matrix without changing the classifier.
3. Run syntax, focused harness, workflow-contract, formatting, OpenSpec, and diff-scope checks.
4. Let the existing `test-mobile` job execute the focused shell regression on the exact PR head.

Rollback is a direct revert of the harness-only additions. There is no data, schema, API, native, or deployment migration.

## Open Questions

None. The corrected issue fixes the four fixture shapes, the rejected rows, allowed path, and verification contract.
