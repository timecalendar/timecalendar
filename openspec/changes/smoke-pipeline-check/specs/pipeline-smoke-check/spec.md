# pipeline-smoke-check — delta

## ADDED Requirements

### Requirement: Pipeline smoke test leaves a docs marker
The repository SHALL contain `docs/smoke-pipeline-check.md`, a one-sentence marker recording that the 2026-09-06 pipeline smoke test (TIM-466) ran. The marker SHALL carry no product meaning and SHALL be the change's only file outside `openspec/`.

#### Scenario: Marker file present
- **WHEN** the change is applied
- **THEN** `docs/smoke-pipeline-check.md` exists and contains one sentence naming the smoke test

#### Scenario: No product surface touched
- **WHEN** the PR diff is inspected
- **THEN** it touches only `docs/smoke-pipeline-check.md` and `openspec/changes/smoke-pipeline-check/`
