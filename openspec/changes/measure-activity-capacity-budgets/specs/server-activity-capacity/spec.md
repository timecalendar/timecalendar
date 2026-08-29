## ADDED Requirements

### Requirement: The Activity read path has frozen, evidence-backed capacity budgets

The project SHALL publish a capacity-budgets document for the Activity read path at
`docs/react-native-migration/05-tech-specs/activity-capacity-budgets.md`. That document SHALL be
the single authority for the numbers the Activity server endpoint and the release readiness review
are measured against, and SHALL be readable without access to the session that produced it.

For every budget it publishes, the document SHALL state the value, the date it was measured, the
calendar cohort and history depth it was measured at, the command that reproduces it, and what a
breach means. Each of the specification's initial acceptance budgets SHALL be either explicitly
confirmed against measured evidence or replaced by a measured value together with the reason for
the change; a budget SHALL NOT be carried forward merely because it was proposed.

The document SHALL freeze at least: default-page and maximum-page latency at p95; page payload
bytes at p95 and maximum; the default page size, including an explicit recommendation to lower it
below 50 when measured default pages materially exceed the mobile or network budget; unread-count
latency at both a recent and a one-year watermark; a per-page shared-buffer read ceiling; and
memory and event-loop-delay ceilings under a representative concurrent read burst. Lowering the
default page size SHALL NOT change the accepted maximum of 100 or the response contract shape.

#### Scenario: A later ticket reads the budgets without the measuring session's context
- **WHEN** the endpoint ticket or the release readiness review needs the Activity performance gate
- **THEN** every applicable budget is present in the budgets document with its value, measurement date, cohort, and reproducing command
- **AND** no budget requires the measuring ticket's session, scratch directory, or issue thread to interpret

#### Scenario: An initial budget is revised by evidence
- **WHEN** measurement shows one of the specification's initial acceptance budgets is not achievable or not adequate
- **THEN** the budgets document records the measured replacement value and the reason it replaced the initial one

### Requirement: The capacity budgets are enforced by a committed, re-runnable gate

The server SHALL provide a committed command that measures the Activity read path against a
representative fixture database and asserts the frozen budgets. The command SHALL exit non-zero
when any frozen budget is breached, so that it functions as a gate rather than a report, and SHALL
be re-runnable by later tickets without the measuring session's context.

The thresholds the command enforces SHALL be the thresholds the budgets document publishes. An
automated check SHALL fail when the two disagree, so the document and the gate cannot drift apart.

The command SHALL exercise the versioned keyset read shape — ordering by `createdAt` descending
then `id` descending, reading one row beyond the requested limit, and bounding following pages by
the first page's snapshot — and the unread-count shape, at the default and maximum page sizes.

#### Scenario: A regression breaches a frozen budget
- **WHEN** the capacity command runs against the representative fixture and a measured value exceeds a frozen budget
- **THEN** the command reports which budget was breached and its measured value
- **AND** exits non-zero

#### Scenario: The published budgets and the enforced thresholds disagree
- **WHEN** the budgets document publishes a threshold that differs from the one the command enforces
- **THEN** an automated check fails

### Requirement: The index verdict for the Activity read shapes is recorded with plan evidence

The project SHALL record, per query shape of the Activity read path, whether the indexes already
present on `calendar_log` are sufficient. Each verdict SHALL be supported by
`EXPLAIN (ANALYZE, BUFFERS)` evidence captured at the one-, ten-, and hundred-calendar cohorts over
both recent and year-long history, reporting node types, chosen index, estimated and actual rows,
shared-buffer hits and reads, and sort method and sort space.

A shape SHALL be recorded as sufficient only when its plan contains no sequential scan of
`calendar_log`, any sort is a bounded top-N heapsort rather than an external merge, its measured
p95 is within the frozen budget, and the production plan agrees with the fixture plan on node types
and chosen index. Otherwise the shape SHALL be recorded as insufficient together with the single
index that resolves it.

A recorded insufficiency SHALL be the only authorization for a later ticket to add an index
migration for the Activity read path, and that authorization SHALL extend only to the named index.

#### Scenario: A read shape cannot be served by the existing indexes
- **WHEN** a shape's plan shows a sequential scan of `calendar_log`, an external merge sort, or a p95 over its frozen budget
- **THEN** the verdict records that shape as insufficient
- **AND** names the one index that resolves it

#### Scenario: A later ticket proposes an index migration
- **WHEN** an index migration for the Activity read path is proposed
- **THEN** it is authorized only if the recorded verdict names that index for an insufficient shape

### Requirement: Activity capacity measurement artifacts contain no private data

Artifacts produced while measuring Activity capacity SHALL contain aggregate values only: counts,
percentiles, bucket labels, byte sizes, durations, index names, and query-plan node types. This
covers the investigation pack, the committed volume-profile fixture, the budgets document, the
gate's output, the pull-request body, and issue comments.

These artifacts SHALL NOT contain a calendar token, calendar URL or query string, event title,
location, description, UID or time, any calendar, calendar-log, user, subscription, or trace
identifier, or any database connection string or credential — including inside captured query-plan
text.

Query-plan text captured from production SHALL be reduced by an explicit allowlist of plan fields,
so that a plan field carrying literal values is excluded by not being listed rather than by being
removed after the fact. Each committed document SHALL open with a privacy-boundary statement naming
what it does and does not contain, so that the guarantee is confirmable by inspection.

Production measurement SHALL be read-only: queries run inside a read-only transaction under an
explicit statement timeout, with no production write, no per-user or per-calendar drill-down, and
no load test against production.

#### Scenario: A production query plan is captured
- **WHEN** a query plan is captured from the production database
- **THEN** only allowlisted plan fields are emitted
- **AND** the plan's index conditions, filters, and output expressions are absent from the artifact

#### Scenario: A reviewer checks an artifact for leakage
- **WHEN** a reviewer inspects any committed measurement artifact
- **THEN** its privacy-boundary statement is present
- **AND** no token, event content, or opaque identifier appears in the artifact
