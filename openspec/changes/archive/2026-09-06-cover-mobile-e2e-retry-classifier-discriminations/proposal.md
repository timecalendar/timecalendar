## Why

The structural Maestro retry classifier already depends on four distinct branches that its focused shell harness does not independently protect. Focused fixtures and mutation checks are needed now so a future refactor cannot silently drop assertion-family recognition, command-set membership, restart-boundary membership, or the explicit empty-record path while the broad baseline still passes.

## What Changes

- Add four minimal fake-Maestro fixtures to `mobile/e2e/test_run_e2e.sh`, one for each behaviorally distinguishable retry-classifier contract.
- Add exact mutation proofs showing that each fixture alone catches the intended classifier regression.
- Prove that a parseable empty `commands.json` reaches the classifier rather than taking the missing-record path.
- Keep the classifier, runtime behavior, CI workflow, documentation, and native/device scope unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: require the deterministic harness to protect the four distinguishable structural classifier branches and their empty-record diagnostic.

## Impact

- Implementation is limited to `mobile/e2e/test_run_e2e.sh`.
- The existing `test-mobile` CI path already runs this proof; no workflow or `run-e2e` label change is needed.
- No API contract, generated client, database migration, native/store configuration, infrastructure, dependency, or legacy Flutter surface changes.
- Sensitive surfaces: none.
