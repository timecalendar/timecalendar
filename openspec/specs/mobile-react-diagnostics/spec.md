# mobile-react-diagnostics Specification

## Purpose
Defines reproducible mobile-only React Doctor scanning, durable diagnostic classification,
changed-code CI enforcement, dependency-boundary evidence, and final integration verification.

## Requirements

### Requirement: Reproducible standalone mobile scan
The mobile project SHALL expose a repository command that runs an exactly pinned React Doctor 0.9.13 against the standalone `mobile/` Expo project with telemetry and score reporting disabled. The command SHALL exclude cross-project supply-chain analysis and SHALL remain advisory so a full existing diagnostic inventory is emitted.

#### Scenario: Full scan uses the mobile project boundary
- **WHEN** a developer installs `mobile/package-lock.json` and runs the documented full React Doctor command from `mobile/`
- **THEN** React Doctor reports the Expo project rooted at `mobile/`, uses version 0.9.13, emits code diagnostics without telemetry or score reporting, and does not attribute root/web dependencies to the mobile project

#### Scenario: Full debt remains visible
- **WHEN** the full mobile scan encounters existing warning or error diagnostics
- **THEN** it completes in advisory mode and emits the complete inventory for classification rather than hiding findings or failing before the report can be reviewed

### Requirement: Durable diagnostic classification
The repository SHALL keep a normalized React Doctor report under `docs/mobile/` that records the exact scan contract, total counts, and a traceable disposition for every diagnostic. Every error SHALL have an individual disposition; warning cohorts SHALL reconcile exactly to the warning total and include evidence, ownership, and a revisit trigger where deferred.

#### Scenario: Report accounts for all findings
- **WHEN** the full scan baseline is refreshed after implementation
- **THEN** the sum of recorded error and warning rule counts equals the recorded overall totals, every error names its repository-relative location and disposition, and every warning belongs to an evidence-backed cohort with an owner

#### Scenario: Safe compiler cleanup is accepted
- **WHEN** a React Compiler unsupported-syntax finding has a clearer behavior-preserving rewrite
- **THEN** focused tests prove its cleanup, failure, lifecycle, and observability obligations and the refreshed scan no longer reports that finding

#### Scenario: Clarity takes precedence over analyzer conformance
- **WHEN** removing a compiler bailout would obscure cleanup, failure-domain, single-flight, or observability behavior
- **THEN** the implementation retains the clear code and records an evidence-backed deferral and revisit trigger without a suppression

#### Scenario: Manual memoization is classified semantically
- **WHEN** manual-memoization warnings are reviewed
- **THEN** representative renderer, context/hook, lifecycle, and removable-local sites are validated and all remaining occurrences are accounted for by an evidence-backed role cohort rather than removed mechanically

### Requirement: New changed-code findings are blocked
Mobile CI SHALL run the pinned React Doctor against findings newly introduced relative to `origin/main` and SHALL fail for either warning- or error-severity diagnostics. Existing full-project debt SHALL remain advisory and SHALL NOT fail an unrelated change solely because the touched file already contained a baseline finding.

#### Scenario: New warning fails the mobile gate
- **WHEN** changed mobile code introduces a React Doctor warning that is absent from `origin/main`
- **THEN** the changed-code command exits non-zero and the mobile CI job fails at a named React Doctor step

#### Scenario: New error fails the mobile gate
- **WHEN** changed mobile code introduces a React Doctor error that is absent from `origin/main`
- **THEN** the changed-code command exits non-zero and the mobile CI job fails at a named React Doctor step

#### Scenario: Existing debt does not charge unrelated work
- **WHEN** a changed file retains a diagnostic already present with the same identity on `origin/main` and introduces no new finding
- **THEN** the changed-code command does not fail because of that pre-existing diagnostic

#### Scenario: Comparison base is available
- **WHEN** the mobile CI job runs on a feature-branch push
- **THEN** checkout history includes a resolvable `origin/main` merge base and the Doctor step fails closed if the configured base cannot be resolved

### Requirement: Mobile dependency evidence is unambiguous
The diagnostic report SHALL state that mobile dependency ownership is determined from the standalone `mobile/package.json` and lockfile, and SHALL record command evidence showing that Next is absent from that dependency tree. The implementation MUST NOT change root/web dependencies to resolve a mobile React Doctor report.

#### Scenario: False Next attribution is disproved
- **WHEN** the mobile diagnostic baseline is reviewed
- **THEN** it includes the result of running `npm ls next` from `mobile/` and React Doctor's mobile project metadata, showing no mobile Next dependency

#### Scenario: Sibling dependency remains out of scope
- **WHEN** a dependency diagnostic originates from the independent root/web package graph
- **THEN** it is not treated as a mobile vulnerability and no root/web dependency is changed by this mobile diagnostics work

### Requirement: Final integration evidence is complete
The final report and issue evidence SHALL list the seven prerequisite pull requests and merged commits, historical and fresh before/after diagnostic counts, focused verification for every changed behavior, mobile TypeScript and lint results, the full Jest result including whether the process exited naturally, the full and changed React Doctor results, and every deliberate deferral.

#### Scenario: Integration mission is ready to close
- **WHEN** the implementation reaches review on the exact pull-request head
- **THEN** all prerequisite merge evidence and verification results are recorded, no error-severity diagnostic is untriaged, every warning is classified, and the false Next report cannot be read as a mobile dependency vulnerability
