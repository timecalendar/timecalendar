# server-queue-reliability Specification

## Purpose
TBD - created by archiving change refactor-server-queue. Update Purpose after archive.
## Requirements
### Requirement: Job errors propagate to BullMQ
The queue layer SHALL NOT swallow job handler errors: a throwing handler SHALL result in a failed BullMQ job (honoring its `attempts`/`backoff` options), never in a job marked completed.

#### Scenario: Throwing handler fails the job
- **WHEN** a job handler throws
- **THEN** the job is recorded as failed (or retried if attempts remain) — it is never marked completed

### Requirement: Bounded Redis retention
All jobs SHALL carry `removeOnComplete`/`removeOnFail` policies so queue storage in Redis does not grow unbounded.

#### Scenario: Completed jobs are pruned
- **WHEN** jobs complete or fail over time
- **THEN** their Redis entries are removed per the configured age/count policies

### Requirement: Job-run recording policy
Job lifecycle recording SHALL be driven by BullMQ queue events (`completed`/`failed`), not by a wrapping try/catch. Cron jobs SHALL be recorded on every run; item jobs (e.g. `sync_calendar`) SHALL be recorded only on failure.

#### Scenario: Cron run is recorded
- **WHEN** a cron job completes or fails
- **THEN** a job-run record (structured log) is emitted for the run

#### Scenario: Item job success is not recorded
- **WHEN** a `sync_calendar` job completes successfully
- **THEN** no per-job success record is emitted (throughput is visible via metrics, not records)

#### Scenario: Item job failure is recorded
- **WHEN** a `sync_calendar` job fails permanently
- **THEN** a failure record including the job name, queue, and error is emitted

### Requirement: Queue observability via OTel
The queue-event listeners SHALL emit OpenTelemetry counters for completed and failed jobs and a job-duration histogram, labeled with queue and job name, through the existing observability meter. BullMQ-native trace telemetry SHALL be enabled on every queue and worker via the shared library's `telemetry` passthrough.

#### Scenario: Metrics emitted on completion
- **WHEN** any job completes or fails
- **THEN** the corresponding counter increments and the duration histogram records the run, both labeled `(queue, job name)`

#### Scenario: Traces span producer to consumer
- **WHEN** a job is enqueued and later processed
- **THEN** the processing span is linked to the enqueue context via BullMQ-native telemetry

