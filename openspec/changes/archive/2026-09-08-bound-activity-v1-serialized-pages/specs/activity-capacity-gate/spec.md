## ADDED Requirements

### Requirement: Oversized serialized-page regression is mutation-effective

The deterministic PostgreSQL-backed HTTP proof SHALL read the many-change source log through the
real `POST /v1/calendar-logs/search` route until the cursor chain ends. It SHALL assert every raw
response text is below the frozen 1,000,000-byte G7 threshold and SHALL compare only aggregate
change counts to prove the chain neither duplicates nor omits entries. The test output SHALL NOT
emit response bodies or row-level values.

#### Scenario: Removing the byte stop fails the proof

- **WHEN** the service mutation removes or raises the serialized-byte stopping condition so the
  3,656-change projection returns atomically
- **THEN** the focused HTTP test fails on the frozen byte threshold

#### Scenario: Moving the continuation offset fails the proof

- **WHEN** the continuation mutation repeats or skips one atomic change entry between pages
- **THEN** the focused HTTP test fails its aggregate reconstruction assertion

#### Scenario: Proof output stays aggregate-only

- **WHEN** the focused test and candidate harness report their results
- **THEN** output contains only thresholds, byte/count aggregates, cohort keys, timing, and candidate
  identity, never tokens, calendar/user/event/log identifiers, cursors, bodies, or event content

## MODIFIED Requirements

### Requirement: Default page size decision

The document SHALL record the measured serialized byte distribution of a default 50-item virtual
page and state whether the default item limit of 50 remains safe together with the server's
serialized-byte target. The public response contract shape and maximum item limit of 100 SHALL NOT
change. The frozen G7 threshold SHALL remain serialized v1 page p99 below 1,000,000 bytes.

#### Scenario: Byte distribution is measured on the v1 response shape

- **WHEN** page bytes are measured
- **THEN** the measurement uses the exact real-route response text, including virtual fragments and
  envelope fields, rather than the legacy shape, raw database row, or compressed transfer size

#### Scenario: Worst case is reported alongside the percentiles

- **WHEN** the byte distribution is recorded
- **THEN** it reports p50, p95, and p99 together with the largest page produced across the complete
  many-changes-in-one-log cursor chain

#### Scenario: Historical failing evidence is not reused

- **WHEN** the correction merges
- **THEN** the release-review owner freezes a new exact candidate and reruns every affected
  candidate-bound gate before changing the current G7 verdict
