# timecalendar-release-operations Specification

## Purpose
Defines the operator contract for selecting immutable TimeCalendar release images,
proving migration and calendar-sync capacity safety, and applying explicit promotion,
observation, abort, and rollback gates without automating the production tag flip.

## Requirements
### Requirement: A release candidate is bound to immutable build and runtime evidence

The release procedure SHALL resolve the target from the remote `main` ref immediately
before evaluation, SHALL require the successful TimeCalendar build for that exact
40-character SHA, and SHALL record separate immutable registry digests for the
`main-<sha>` server and web images. Preproduction evidence SHALL prove desired state,
Argo CD reconciliation, pod image tags, and runtime image digests all match that candidate
before soak begins.

#### Scenario: One candidate reaches preproduction

- **WHEN** an operator evaluates a commit for promotion
- **THEN** the recorded workflow run, server digest, web digest, preproduction desired
  tags, running pod image IDs, and timestamps all identify the same full SHA

#### Scenario: Main moves during evaluation

- **WHEN** the remote `main` SHA changes after evidence collection begins
- **THEN** the old evidence is retained as an abandoned candidate and a new candidate and
  soak are started rather than mixing artifacts from the two commits

### Requirement: Migration safety is exercised on representative PostgreSQL data

The release evidence SHALL exercise migration
`1787641039755-AddCalendarSyncPlannedAt` up and down on representative calendar rows,
verify values, nullability, index state, and base-row preservation, and record row count,
relation size, wall-clock runtime, relevant lock waits, blocked sessions, and WAL impact.
The final preproduction state SHALL have the migration applied.

#### Scenario: Migration round trip succeeds

- **WHEN** the migration proof runs against representative fresh/old,
  active/inactive, generic/Lyon calendar rows
- **THEN** `up` creates and backfills the required column/index, `down` removes only those
  derived objects, and the final restored `up` state matches the entity schema

#### Scenario: Migration exceeds its operating budget

- **WHEN** runtime, lock wait, blocked writer, duplicate-migrator, or WAL evidence exceeds
  a runbook gate
- **THEN** the candidate is no-go and production promotion does not begin

### Requirement: Fan-out capacity evidence separates calendar jobs from HTTP attempts

The release runbook SHALL use production-safe aggregate counts and bounded telemetry to
model the initial and steady-state five-minute fan-out. The evidence SHALL include the
14-day active cutoff, five-minute due buckets, ready replica count, actual per-pod sync
concurrency, queue depth/age and service time, candidate retry policy, attempts per job,
and ADE request rate/error ratio. It SHALL contain no raw URL, token, resource id,
credential, or event data.

#### Scenario: Initial backlog fits the envelope

- **WHEN** the largest initial due bucket is compared with observed worker capacity and
  HTTP-attempt amplification
- **THEN** the worksheet shows that it drains within the stated observation window with
  headroom and without violating an upstream rate gate

#### Scenario: Queue is not stable

- **WHEN** waiting depth or oldest-job age grows across observation windows, observed
  completion rate stays below arrivals, or ADE attempt/error rate exceeds a gate
- **THEN** the operator aborts or rolls back the image and does not continue promotion

### Requirement: Promotion uses explicit soak, observation, abort, and rollback gates

The checked-in runbook SHALL define a preproduction soak, a production go/no-go checklist,
post-rollout observation windows including the first full Lyon hour, exact verification
commands/queries, named abort criteria, and prior-image rollback. It SHALL distinguish the
normal additive-schema-retaining image rollback from destructive schema rollback and SHALL
NOT perform or automate the production tag flip.

#### Scenario: Emergency image rollback

- **WHEN** an abort criterion fires after the candidate image starts
- **THEN** the operator restores the previously recorded immutable image tag/digest while
  retaining `syncPlannedAt`, then verifies the old image is healthy against that schema

#### Scenario: Destructive schema rollback is considered

- **WHEN** an operator proposes running migration `down`
- **THEN** the runbook requires the old image to be serving, writers to be quiesced, a
  named backup/restore point, and explicit human authorization before the column/index are
  dropped
