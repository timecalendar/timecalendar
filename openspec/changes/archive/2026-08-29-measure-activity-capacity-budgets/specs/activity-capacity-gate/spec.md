## ADDED Requirements

### Requirement: Frozen capacity gate document
The Activity read path SHALL have a committed gate document recording the aggregate volume buckets, the fixture definitions, the budget table, the query-plan evidence, and the measured default-page byte distribution. Ticket 2's acceptance and Ticket 8's release review SHALL be measured against that document.

#### Scenario: The document is the reference for endpoint acceptance
- **WHEN** the v1 calendar-log endpoint is reviewed for acceptance
- **THEN** its measured latency, plan, and payload size are compared against the committed gate table rather than against numbers restated in a ticket or a pull-request comment

#### Scenario: A budget changes only with evidence beside it
- **WHEN** any budget in the gate table is tightened or loosened
- **THEN** the same commit updates that row's evidence citation to the harness run that justifies it and appends a dated entry to the document's change log

#### Scenario: Gates this harness cannot measure are marked, not implied
- **WHEN** the gate table lists a mobile-side budget such as single-flight collapse or cached-scroll smoothness
- **THEN** that row names the ticket that verifies it instead of citing a server harness run

### Requirement: Index sufficiency verdict
The document SHALL state one unambiguous verdict: that the existing `calendar.token`, `calendar_log(calendarId, createdAt)`, and `calendar_log(createdAt)` indexes satisfy the v1 keyset and unread-count queries, or that a specifically named composite index is required. A verdict of "insufficient" SHALL be accompanied by the plan evidence that proves it.

#### Scenario: Verdict is backed by plan evidence
- **WHEN** the verdict states that an index is required
- **THEN** the document contains the `EXPLAIN (ANALYZE, BUFFERS)` output for the cohort that fails the budget, the proposed index definition, and the plan obtained with that index present

#### Scenario: The verdict does not create the index
- **WHEN** the verdict states that an index is required
- **THEN** no migration is added by this change; the named index becomes an explicit input to Ticket 2

### Requirement: Representative plan evidence across cohorts
The document SHALL record `EXPLAIN (ANALYZE, BUFFERS)` evidence for the 1-calendar, 10-calendar, and 100-calendar cohorts, each over recent and year-long history, for both the keyset page query and the unread-count query.

#### Scenario: Plans are captured against a corpus with background volume
- **WHEN** a plan is captured for a measurement cohort
- **THEN** the table also contains the background corpus, and the document states the corpus row count and calendar count under which that plan was obtained

#### Scenario: Provisional-scale results are labelled
- **WHEN** a measurement is captured before the production aggregate buckets are available
- **THEN** the document labels it as provisional scale and states the scale it was run at

### Requirement: Default page size decision
The document SHALL record the measured serialized byte distribution of a default 50-log page and state whether the default page size of 50 is safe or must be lowered. The response contract shape and the maximum of 100 SHALL NOT change.

#### Scenario: Byte distribution is measured on the v1 response shape
- **WHEN** page bytes are measured
- **THEN** the measurement serializes the v1 response shape, which omits `calendarToken`, rather than the legacy shape or the raw database row

#### Scenario: Worst case is reported alongside the percentiles
- **WHEN** the byte distribution is recorded
- **THEN** it reports p50, p95, and p99 together with the largest page produced by the many-changes-in-one-log cohort

### Requirement: Evidence carries no identifying data
No calendar token, calendar name, event title, event location, event description, calendar ID, calendar-log ID, or cursor value SHALL appear anywhere in the committed evidence, the harness output, or the aggregate query results.

#### Scenario: Plans are redacted before they are recorded
- **WHEN** `EXPLAIN` output is emitted by the harness
- **THEN** UUIDs and quoted string literals are replaced with a redaction marker before the output is printed

#### Scenario: The production read emits aggregates only
- **WHEN** the production aggregate queries run
- **THEN** every projected column is a count, a bucket label, or a percentile, and no row-level identifier or content value is returned

#### Scenario: Production plans are never captured
- **WHEN** query-plan evidence is gathered
- **THEN** it is gathered against the local fixture database only, because `EXPLAIN` output embeds index-condition literals

### Requirement: Production access is read-only and separately executed
The production aggregate queries SHALL be committed to the repository before being run, SHALL be `SELECT`-only within a read-only transaction with a statement timeout, and SHALL be executed by the Founding Engineer. No pipeline stage of this change SHALL open a production database connection.

#### Scenario: The queries are reviewable before execution
- **WHEN** the aggregate SQL is proposed for execution
- **THEN** it already exists as a committed file that a reader can inspect for write statements, missing timeouts, and identifier projections

#### Scenario: Absent aggregates block only the volume table
- **WHEN** the production buckets have not been returned
- **THEN** the fixtures, harness, gate table, plan methodology, and CI test still land, and the document ships with its volume table marked pending

### Requirement: Locally runnable fixtures and harness
The fixture corpus and measurement harness SHALL be runnable by a following ticket against a local database with no production access, and SHALL be deterministic so that a re-run reproduces the same corpus.

#### Scenario: A following ticket reproduces the measurement
- **WHEN** Ticket 2 or Ticket 8 runs the documented seed and measure commands against a local or preproduction database
- **THEN** the same cohorts are produced and the same measurements are reported, without credentials beyond that database

#### Scenario: The corpus reproduces production shape, not only the cohorts
- **WHEN** the fixtures are seeded
- **THEN** a background corpus sized from the aggregate buckets is seeded alongside the measurement cohorts, so index selectivity is representative

### Requirement: Continuous plan regression tripwire
A server test SHALL seed a bounded corpus, refresh planner statistics, and assert that a bounded token request does not sequentially scan `calendar_log`. The assertion SHALL NOT be satisfied by disabling sequential scans.

#### Scenario: The tripwire catches a query rewrite that loses the index
- **WHEN** the keyset query is rewritten so the planner can no longer use `calendar_log(calendarId, createdAt)`
- **THEN** the test fails

#### Scenario: The tripwire does not stand in for the capacity gate
- **WHEN** the test passes
- **THEN** the gate document still records the full-scale harness run as the capacity evidence, and states that the test is a regression tripwire only
