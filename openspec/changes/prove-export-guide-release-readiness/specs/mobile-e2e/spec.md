## ADDED Requirements

### Requirement: The shared harness can select a bounded export-guide proof suite
`mobile/e2e/run_e2e.sh` SHALL accept a closed suite selector for the existing daily smoke pack or a
separate export-guide proof directory. Omitting the selector SHALL preserve the smoke default and
its exact three top-level business journeys. The selected suite SHALL reuse one server lifecycle,
lexical top-level discovery, nested-only helpers, one Maestro process per flow, terminal failure
behavior, bounded structural startup retry, logs, and teardown. Unknown, missing-valued, empty, or
path-shaped suite input SHALL fail before server startup.

#### Scenario: Default invocation preserves daily smoke
- **WHEN** the harness runs without a suite argument
- **THEN** it executes exactly the existing three `mobile/.maestro/*.yaml` journeys and no
  export-guide proof flow

#### Scenario: Export-guide proof is explicitly selected
- **WHEN** the harness runs with the export-guide suite selector
- **THEN** it discovers only that suite's top-level flows in lexical order
- **AND** it retains the shared lifecycle, helper exclusion, retry classifier, and teardown rules

#### Scenario: Invalid suite input fails closed
- **WHEN** the selector is absent after its flag, unknown, empty, or contains a path
- **THEN** the harness exits non-zero before starting the server or Maestro

### Requirement: Manual native workflow selects smoke or export-guide proof at one exact SHA
The native workflow SHALL keep its one daily schedule and manual dispatch, without push,
pull-request, branch, or label triggers. Scheduled invocations SHALL select the smoke suite. Manual
dispatch SHALL require a ref/SHA and a closed suite value, resolve the ref once, and run both
platform jobs appropriate to that suite against the resolved SHA. Daily smoke cadence and the
three-journey inventory SHALL remain unchanged.

#### Scenario: Scheduled health remains unchanged
- **WHEN** the scheduled controller finds relevant changes
- **THEN** Android and iOS run the smoke suite under the existing daily health policy
- **AND** no export-guide or production-guard job is allocated

#### Scenario: Manual export-guide proof selects both platforms
- **WHEN** manual dispatch supplies a reachable ref and the export-guide suite
- **THEN** preparation resolves one immutable SHA and both Android and iOS execute the dedicated
  release-configuration proof for that SHA

#### Scenario: Static workflow validation catches drift
- **WHEN** a workflow edit drops a platform, exact-SHA checkout, release build, suite selector,
  evidence artifact, or production guard, or adds a push/pull-request/label trigger
- **THEN** baseline CI fails its focused workflow-structure proof before native allocation
