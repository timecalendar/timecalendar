## MODIFIED Requirements

### Requirement: iCalendar fetching has an absolute retry budget

An iCalendar fetch SHALL have at most one attempt for normal sources and at most two attempts for retry-enabled sources. Each attempt SHALL receive the shared cancellation signal, no attempt SHALL wait more than seven seconds, and the entire retry-enabled operation—including a `Retry-After` delay—SHALL stop within one nine-second absolute budget even if an individual transport does not settle normally. A retry-enabled source SHALL receive a second attempt only for a timeout while budget remains, a connection reset, HTTP 429 when any valid `Retry-After` delay leaves budget for the next attempt, or HTTP 502/503/504. Every other known or unclassified failure SHALL be terminal and SHALL NOT receive a second attempt.

#### Scenario: Retry-enabled source never responds

- **WHEN** a retry-enabled source does not return a usable response before an attempt timeout and budget remains
- **THEN** the server may start one more transport attempt, but no more than two attempts occur and the fetch settles within the nine-second absolute budget

#### Scenario: Connection reset is retried

- **WHEN** the first attempt fails with a structured connection-reset code and budget remains
- **THEN** exactly one second attempt may start inside the same absolute budget

#### Scenario: Retryable gateway response is retried

- **WHEN** the first attempt returns HTTP 502, 503, or 504 and budget remains
- **THEN** exactly one second attempt may start inside the same absolute budget

#### Scenario: Rate limit delay fits the budget

- **WHEN** the first attempt returns HTTP 429 with a delta-seconds or HTTP-date `Retry-After` whose delay is shorter than the remaining budget
- **THEN** the server waits for that delay, remains cancellation-aware, and bounds the second attempt by the post-wait remainder of the nine-second budget

#### Scenario: Rate limit delay exhausts the budget

- **WHEN** HTTP 429 supplies a `Retry-After` delay that reaches or exceeds the remaining fetch budget
- **THEN** no second attempt starts, the server does not wait past the budget, and the final failure remains classified as rate-limited

#### Scenario: Request cancellation interrupts a retry

- **WHEN** the parent request cancellation signal fires during an iCalendar attempt or `Retry-After` wait, or before its retry
- **THEN** Axios and any wait are aborted and no further attempt starts

#### Scenario: Basic-auth challenge is returned

- **WHEN** an upstream source returns the existing HTTP 401 basic-auth challenge
- **THEN** `IcalFetcher` preserves the current `CustomError` result, classifies it as terminal authentication failure, and does not retry it

#### Scenario: Terminal fetch and content failures are not retried

- **WHEN** the fetch encounters a known timetable UI link, invalid URL, no-events or empty result, invalid iCalendar, authentication failure, TLS/certificate failure, permanent DNS failure, HTTP 4xx other than 429, or any failure outside the finite retryable set
- **THEN** the operation records at most its first attempt, returns an explicit terminal classification without matching an error message, and starts no second attempt

### Requirement: Calendar-sync health is measurable and regression-tested

The server SHALL emit bounded-cardinality telemetry for batch duration, selected and started calendar counts, active upstream work, upstream attempt count, final retry classification and disposition, phase duration, and cancellation outcome. Every classification and disposition label SHALL come from a reviewed finite vocabulary; calendar URLs, response content, exception messages, `Retry-After` values, and arbitrary transport/status codes SHALL NOT become labels. Every process SHALL publish a distinct OTel service-instance identity so replica counters can be aggregated without reset collisions. The repository SHALL contain a production-safe representative load fixture and recorded baseline/fixed profile summaries containing no calendar token, full URL, credential, or event payload.

#### Scenario: A bounded batch is observed

- **WHEN** a user-triggered calendar sync completes, partially completes at its deadline, or is cancelled by disconnect
- **THEN** telemetry records its duration and bounded outcome plus the selected, started, completed, and cancelled work without user-controlled label values

#### Scenario: Fetch attempts and final classification are observed

- **WHEN** a calendar fetch succeeds, exhausts a transient failure, ends in a terminal failure, or is cancelled
- **THEN** telemetry counts each actual attempt start and records exactly one final outcome using only the finite classification and disposition vocabularies

#### Scenario: Replicas export counters

- **WHEN** three server replicas export the same calendar-sync counter name
- **THEN** each series has a distinct `service.instance.id` resource attribute and aggregation does not merge unrelated counter resets

#### Scenario: Representative load regression proof

- **WHEN** the checked-in load fixture runs with large event sets and more due calendars than the concurrency limit
- **THEN** it proves concurrency never exceeds three, no operation remains after request completion, response p95 remains below the 15-second client timeout, and maximum event-loop delay is lower than the recorded baseline

#### Scenario: Evidence is safe to retain

- **WHEN** trace, CPU profile, retry, and sync proof results are committed to the investigation
- **THEN** they contain commands, aggregate dimensions, top frames, timings, trace relationships, and bounded retry classifications but no raw token, query-bearing calendar URL, credential, response content, exception message, or event content

## ADDED Requirements

### Requirement: Background calendar jobs stop after terminal calendar failures

The calendar-sync domain SHALL propagate retry disposition through an explicit typed error contract. The background calendar job SHALL translate a terminal calendar failure to BullMQ's non-retryable error semantics and SHALL propagate transient calendar failures and unrelated operational failures through the existing retry policy. The decision SHALL NOT inspect error-message text.

#### Scenario: Terminal calendar failure executes once

- **WHEN** a background calendar job encounters a terminal calendar failure on its first upstream attempt
- **THEN** that job performs one execution and one upstream attempt, and BullMQ schedules no later attempt for it

#### Scenario: Transient calendar failure retains job retries

- **WHEN** a background calendar job exhausts the fetcher's bounded local attempts with a transient classification
- **THEN** the typed failure remains retryable by BullMQ under the existing three-attempt exponential-backoff configuration

#### Scenario: Unrelated operational failure retains job retries

- **WHEN** calendar sync throws a database, queue, or other error outside the typed terminal calendar-failure contract
- **THEN** the job propagates that error unchanged so BullMQ may apply its existing retry policy
