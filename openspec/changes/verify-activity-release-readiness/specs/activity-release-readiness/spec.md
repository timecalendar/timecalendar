## ADDED Requirements

### Requirement: One candidate-bound readiness record owns the disposition

The repository SHALL contain one Activity release-readiness record identifying the full immutable
code/configuration candidate commit, the evidence date and environment, the exact native-CI target,
and an immutable server image identity when one is available. Every required gate SHALL record its
method, measured value or evidence, threshold, evidence location and `PASS` or `FAIL` verdict.

The top-level disposition SHALL be `GO` only when every required gate passes for that same
candidate. Missing, stale, unknown, mismatched-candidate or failed evidence SHALL produce `NO-GO`.

#### Scenario: Every required row passes for one candidate

- **WHEN** the capacity, runtime, privacy, compatibility, automated and native rows all identify the
  same candidate and pass
- **THEN** the readiness record declares `GO`

#### Scenario: Required evidence is absent or belongs to another head

- **WHEN** any required row is missing, unknown, failed or bound to a different candidate
- **THEN** the readiness record declares `NO-GO` and identifies that row without weakening it

### Requirement: Telemetry privacy is mechanically verified across every sink

The release review SHALL inventory Activity metric labels, span names and attributes, application
logs, Crashlytics errors and attributes, and analytics events. Synthetic negative proofs SHALL
verify that tokens, calendar/user/event/log identifiers or content, request bodies, cursors and
values derived from them reach none of those sinks.

Committed evidence MUST contain only the mechanical method and aggregate zero/non-zero results. It
MUST NOT contain raw markers, request/response bodies, cursor values or telemetry excerpts carrying
fixture content.

#### Scenario: Synthetic sensitive markers exercise success and failure paths

- **WHEN** the route and mobile seams are exercised with synthetic markers through success,
  validation, cursor, mapping/storage and network-failure paths
- **THEN** captured metrics, spans, logs, Crashlytics calls and analytics calls contain zero marker
  matches

#### Scenario: Any telemetry sink contains a marker

- **WHEN** a negative query or test finds a synthetic sensitive marker in any Activity telemetry
  sink
- **THEN** the privacy row fails and the release disposition is `NO-GO`

### Requirement: Compatibility is confirmed row by row

The readiness record SHALL separately verify React Native v1 behavior, unchanged valid unversioned
array behavior, malformed bare-string rejection, unchanged Flutter generated client and behavior,
notification-pipeline independence, one-year server retention, backend-environment Activity cache
reset, and compatibility of the previous mobile release with the candidate server.

#### Scenario: All compatibility consumers retain their contract

- **WHEN** focused tests, generated diffs and candidate exercises prove every compatibility row
- **THEN** each row records its own evidence and passes

#### Scenario: One compatibility promise is inferred rather than proven

- **WHEN** any compatibility row lacks a mechanical test, diff, static inspection or candidate-bound
  exercise
- **THEN** that row fails and cannot be replaced by one aggregate compatibility assertion

### Requirement: Exact-candidate automated and native evidence is required

The release review SHALL run the smallest complete server and mobile suites required by the
Activity specification and current repository gates. Android and iOS Maestro results SHALL come
from the existing native workflow resolved to the full candidate commit; the review SHALL NOT
alter the workflow or add an ordinary pull-request trigger solely to obtain proof.

#### Scenario: Both native platforms pass the candidate Activity flow

- **WHEN** the existing native workflow resolves the requested candidate commit and the Activity
  journey completes on Android and iOS
- **THEN** G9 records both platform results as passing exact-candidate evidence

#### Scenario: Native evidence is missing or fails on either platform

- **WHEN** either platform lacks a completed result, resolves another commit or fails the Activity
  journey
- **THEN** G9 fails and the release disposition is `NO-GO`

### Requirement: Physical-device checks remain visible and non-blocking for repository merge

The repository SHALL contain one `(HUMAN: ...)` migration-inbox note listing the remaining physical
iPhone, iPad portrait, supported Android, assistive-technology, large-text and low-end scrolling
passes. Missing physical-device results SHALL remain release follow-up evidence and SHALL NOT be
represented as a repository-merge approval requirement.

#### Scenario: Automated evidence is complete but physical passes remain

- **WHEN** the repository change otherwise satisfies its automated gates and the physical-device
  checklist is incomplete
- **THEN** the note retains the unchecked work without blocking repository review or merge

### Requirement: Rollout and rollback are executable but not executed by the review

The readiness record SHALL specify server-image deployment and v1/unversioned route verification
before any store or OTA build that calls v1. It SHALL specify rollback to a compatible mobile
release or OTA plus the prior server image while retaining the additive v1 route and Activity cache
tables without destructive rollback.

#### Scenario: A separate rollout is authorized after a GO

- **WHEN** an operator follows the release order for the recorded candidate
- **THEN** the server image is deployed and verified before the mobile build that calls v1

#### Scenario: Rollback is required

- **WHEN** the Activity rollout must be reversed
- **THEN** the operator restores a compatible mobile release or OTA and prior server image without
  dropping the v1 route or Activity tables

#### Scenario: No deploy authorization exists for the review

- **WHEN** the readiness review gathers and commits evidence
- **THEN** it performs no deployment, image promotion, store submission, OTA release, live backfill
  or production mutation

### Requirement: Activity documentation agrees with the readiness result

The Phase 07 roadmap SHALL agree with the Activity revival specification, Architecture Book feature
map and changelog, active OpenSpec change, and physical-device note on implemented behavior, candidate
disposition, remaining work and rollout boundary. A changed binding architecture rule SHALL include
an ADR and Architecture Book changelog entry in the same change.

#### Scenario: The release record is finalized

- **WHEN** the readiness disposition is committed
- **THEN** every named Activity documentation surface describes the same current behavior and
  release state

#### Scenario: No binding rule changes

- **WHEN** the review only records evidence and confirms existing Activity architecture
- **THEN** no new ADR is added and the Architecture Book changes are limited to current-state
  reconciliation and its changelog

### Requirement: Failed gates are remediated separately and rerun

A failed frozen gate or missing required candidate evidence SHALL keep Activity at `NO-GO`. The
bounded correction or separately authorized evidence action SHALL be tracked outside the review,
and every affected candidate-bound gate SHALL be rerun after it lands. Frozen thresholds MUST NOT
be weakened or relabelled to close the review.

#### Scenario: A frozen gate fails

- **WHEN** measurement or CI fails a frozen Activity release gate
- **THEN** the readiness record remains `NO-GO`, identifies the bounded remediation, and requires
  fresh affected evidence for the corrected candidate

#### Scenario: Evidence requires an unauthorized deploy action

- **WHEN** an immutable environment candidate or telemetry window cannot be obtained without a new
  deployment or credentialed action
- **THEN** the review records the exact missing evidence and remains `NO-GO` until separately
  authorized work supplies it
