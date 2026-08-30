## ADDED Requirements

### Requirement: Release review measures the shipped Activity route
The release review SHALL re-run the representative 1-, 10-, and 100-calendar recent, year, empty,
and many-change cohorts against the release candidate. It SHALL measure the shared query path and
the shipped `POST /v1/calendar-logs/search` route so controller validation, mapping, serialization,
and application-runtime overhead are included.

#### Scenario: Default and maximum pages are measured
- **WHEN** the release candidate is evaluated at page sizes 50 and 100
- **THEN** the record reports first-page and following-page p50/p95/p99, serialized page bytes, and
  pass/fail against 50-log p95 below 250 ms and 100-log p95 below 500 ms

#### Scenario: Unread and concurrent reads are measured
- **WHEN** recent and one-year unread watermarks and representative concurrent requests run
- **THEN** the record reports unread-count latency, error rate, heap growth, and event-loop max/p99
  delay and compares them with the frozen baseline and budgets

### Requirement: Release plans prohibit full table and index walks
Synthetic non-production `EXPLAIN (ANALYZE, BUFFERS)` evidence for a bounded token request SHALL show
neither a sequential scan of the full `calendar_log` table nor a full global-index walk. The G3a
verdict SHALL consider access path, rows removed by filter, and buffers rather than only the plan
node name.

#### Scenario: Empty 100-calendar cohort uses the bounded path
- **WHEN** the release candidate serves the `c100-empty` first page
- **THEN** the plan uses per-calendar access through `IDX_calendar_log_calendar_createdAt`, does not
  exhaust `IDX_calendar_log_createdAt`, and passes both G3 and G3a

#### Scenario: CI tripwire is green
- **WHEN** the bounded plan regression test passes
- **THEN** it is recorded as continuous proof in addition to, not instead of, the full release
  measurement

### Requirement: Release results are compared without rewriting frozen gates
The readiness record SHALL compare candidate results with the frozen Activity capacity document and
preserve the frozen budgets and evidence. Any proposed budget change SHALL update the frozen row's
evidence and dated change log in the same commit and SHALL require a new release verdict.

#### Scenario: Candidate passes existing budgets
- **WHEN** all measurements remain inside the frozen gates
- **THEN** the readiness record cites those gates without modifying their values

#### Scenario: Candidate misses an existing budget
- **WHEN** any candidate measurement exceeds a frozen gate
- **THEN** the verdict is `NO-GO` and the miss becomes fix work rather than an undocumented threshold
  exception
