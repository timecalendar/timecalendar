## ADDED Requirements

### Requirement: Release evidence is bound to one candidate
The Activity release-readiness record SHALL identify the full commit and immutable server image
exercised in preproduction and SHALL give each gate a method, timestamp, measured value, frozen
comparison, and pass/fail verdict. It SHALL end in exactly one `GO`, `NO-GO`, or `PENDING` verdict,
and only `GO` is releasable.

#### Scenario: Candidate evidence is complete
- **WHEN** Activity is marked `GO`
- **THEN** every recorded capacity, privacy, compatibility, and automated-check result refers to the
  same release candidate and passes its stated gate

#### Scenario: Candidate changes during review
- **WHEN** the commit or server image changes after evidence collection starts
- **THEN** the existing run is retained as an abandoned or failed candidate and the affected
  evidence is re-collected for the new candidate instead of mixing results

### Requirement: Telemetry carries no Activity identity or payload
No token, calendar, user, event, calendar-log, cursor, or value derived from any of them SHALL appear
in a metric label, span attribute, Crashlytics attribute, analytics event, or application log line.
The readiness record SHALL state the static, automated sink-capture, and preproduction runtime
methods used to verify that absence.

#### Scenario: Synthetic sensitive markers traverse success and failure paths
- **WHEN** Activity server and mobile paths are exercised with synthetic marker values
- **THEN** captured telemetry and log sinks contain none of those markers or derived values and use
  only bounded source-controlled attributes

#### Scenario: Runtime telemetry is inspected
- **WHEN** the candidate handles synthetic Activity requests in preproduction
- **THEN** the bounded inspection window contains route health data but no request identity, payload,
  or cursor-derived value, and the committed evidence includes no raw telemetry

### Requirement: Compatibility is confirmed row by row
The readiness record SHALL confirm every compatibility row from the authoritative Activity
specification with separate evidence. Valid unversioned array requests and their response contract
SHALL remain unchanged, the committed Flutter client and behavior SHALL remain untouched, and the
previous mobile release's exact wire request SHALL succeed against the candidate server. The bare
string `tokens` request SHALL remain the documented intentional 400 tightening.

#### Scenario: Previous release calls the candidate
- **WHEN** the previous release's valid unversioned calendar-log request is sent to the candidate
  server
- **THEN** it succeeds with the legacy response shape while the v1 route remains independently
  bounded and token-free in its response

#### Scenario: Compatibility artifacts are checked for drift
- **WHEN** the release-review diff and generated artifacts are inspected
- **THEN** `app/`, Flutter generated sources, the committed OpenAPI contract, and the React Native
  generated client contain no review-induced changes

#### Scenario: Adjacent consumers remain compatible
- **WHEN** retention, notification-pipeline coexistence, and backend-environment reset proofs run
- **THEN** existing logs retain the one-year lifecycle, notifications keep reading the same log
  rows independently, and React Native clears Activity cache/read state with backend-bound data

### Requirement: Automated release checks are complete
All server and React Native automated gates applicable to the release candidate SHALL pass, including
the real-server Activity integration and applicable native E2E checks. Exact commands, check counts,
and candidate commit SHALL be recorded. Physical iOS, iPad portrait, and Android checks SHALL be
listed in a dated `(HUMAN: ...)` migration-inbox note and SHALL NOT block repository merge.

#### Scenario: Machine-checkable release suite passes
- **WHEN** the readiness verdict becomes `GO`
- **THEN** server tests/E2E/type/lint/OpenAPI drift and mobile generation/type/lint/Jest/real-server
  integration/native-E2E gates are recorded green for the candidate

#### Scenario: Physical-device work remains explicit
- **WHEN** a check requires a physical supported device or store-installed previous release
- **THEN** the inbox note names the platform, scenario, expected result, evidence slot, and human
  owner without converting the missing device result into a merge blocker

### Requirement: Deployment order and rollback are executable
The readiness record SHALL require the exact verified server image to deploy and pass route smokes
before any store or OTA build that calls `/v1` is released. It SHALL provide executable rollback to
the previous compatible mobile release/OTA where runtime compatibility permits and the prior server
image, while retaining the additive v1 route and Activity SQLite tables and keeping the unversioned
endpoint available.

#### Scenario: Rollout ticket consumes a go verdict
- **WHEN** the Founding-Engineer-owned rollout ticket begins after `GO`
- **THEN** it can identify the approved server image, deploy and smoke it first, and only then release
  the v1-calling mobile build

#### Scenario: Candidate must be rolled back
- **WHEN** an observation or compatibility gate fails during the later rollout
- **THEN** the operator can restore the compatible mobile release/OTA and/or prior server image
  without a destructive API or SQLite rollback and can still serve valid unversioned requests

### Requirement: Documentation reflects the shipped Activity contract
Documentation SHALL make the Activity roadmap entry, mobile Architecture Book feature map and
changelog, applicable ADRs, and final ticket links in the technical specification describe the
release candidate rather than the pre-implementation plan. A changed load-bearing rule SHALL be
recorded through an ADR.

#### Scenario: Release documentation is reconciled
- **WHEN** the readiness record is completed
- **THEN** the roadmap marks the actual Activity delivery state, the feature map and changelog match
  current ownership and triggers, the ADR set matches all load-bearing contracts, and ticket links
  identify the completed delivery chain

### Requirement: Any failed gate stops release and creates rework
If a capacity, privacy, compatibility, or automated gate fails, the readiness verdict SHALL be
`NO-GO`; a uniquely titled fix issue SHALL be created through safe ticket dispatch as a child of the
Activity epic, and the release-review issue SHALL be blocked on it. A failed gate MUST NOT be waived,
weakened, or replaced with local-only evidence.

#### Scenario: A release gate fails
- **WHEN** any required measurement or verification is outside its accepted contract
- **THEN** Activity is not approved, the evidence names the failed gate, and a first-class fix
  dependency with an owner and acceptance proof blocks the release review
