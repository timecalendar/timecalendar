## ADDED Requirements

### Requirement: Native E2E is a daily health signal that always executes

The native mobile E2E workflow SHALL be an informational health signal rather than an ordinary feature-merge gate. It SHALL expose exactly one daily schedule and a manual dispatch, SHALL have no push or pull-request trigger, and SHALL NOT use a label convention to run on feature-branch updates. Every scheduled and every manual invocation SHALL build the server image and run both the Android and the iOS journeys against one resolved commit. No job and no flow step SHALL be skipped by a condition derived from changed paths, the trigger, or an earlier run, so a scheduled run's conclusion always reflects executed flows. Failures SHALL preserve diagnostic evidence without blocking unrelated feature delivery.

#### Scenario: An ordinary feature pull request uses only fast gates

- **WHEN** a pull request changes mobile code, a Maestro flow, server behavior, or the OpenAPI contract
- **THEN** the native E2E workflow is not invoked
- **AND** the baseline workflow still runs applicable unit, component, integration, type, lint, selector, harness, and workflow-structure checks

#### Scenario: A scheduled run with no new commits still executes

- **WHEN** the daily schedule fires and nothing changed on `main` since the previous scheduled run
- **THEN** the server image build, the Android job and the iOS job all run against the resolved `main` commit
- **AND** the run concludes success only if the flows passed on both platforms

#### Scenario: A failing lane stays red on the next day

- **WHEN** the previous scheduled run failed and no commit landed since
- **THEN** the next scheduled run executes the flows again and fails again rather than reporting success

#### Scenario: Manual diagnosis selects an immutable target

- **WHEN** manual dispatch supplies a reachable ref or SHA
- **THEN** preparation resolves it once and both native platforms run against that SHA
- **AND** invalid input fails before native allocation

#### Scenario: Native invocations do not overlap

- **WHEN** a daily or manual invocation starts while another is active
- **THEN** workflow concurrency queues it without cancelling the in-progress evidence collection

#### Scenario: A skip condition is reintroduced

- **WHEN** the workflow gains a job condition, a step condition other than failure-only diagnostics upload, a `continue-on-error`, or a change-detection output gating the platform jobs
- **THEN** the baseline workflow-contract check fails

## REMOVED Requirements

### Requirement: Native E2E is a conditional health signal

**Reason**: A scheduled run that skipped every platform job reported success, which hid a red lane from 2026-09-13 to 2026-10-26. The cadence is replaced by "Native E2E is a daily health signal that always executes".
**Migration**: None for contributors. Scheduled runs now always execute both platforms; manual dispatch is unchanged.

### Requirement: Scheduled change detection uses the previous attempt boundary

**Reason**: Scheduled runs no longer detect changes, so there is no comparison boundary to define.
**Migration**: None. The previous-attempt lookup and the relevant-path list are removed from the workflow and its contract test.
