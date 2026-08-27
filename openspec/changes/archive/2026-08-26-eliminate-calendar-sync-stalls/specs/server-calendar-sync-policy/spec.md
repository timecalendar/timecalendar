## MODIFIED Requirements

### Requirement: Concurrent upstream fetches are bounded

The server SHALL run no more than three upstream calendar fetches concurrently within one user-triggered sync request. Calendars waiting for a slot SHALL NOT start after the request work deadline or cancellation signal fires, and every started operation SHALL settle before the controller operation resolves. A failure to fetch one calendar SHALL NOT abort the others.

#### Scenario: A large batch stays within the concurrency limit

- **WHEN** a user-triggered batch contains more than three due calendars
- **THEN** at most three upstream requests are active at once, while remaining calendars wait for a slot

#### Scenario: One failing calendar does not fail the batch

- **WHEN** a batch sync includes a calendar whose upstream source errors before the request deadline
- **THEN** the remaining eligible calendars are still attempted within the concurrency and time bounds, and the failing calendar is returned with its last-known content

#### Scenario: Queued work does not outlive cancellation

- **WHEN** the request is cancelled while calendars are waiting for a concurrency slot
- **THEN** no waiting calendar starts, active upstream requests are aborted, and all started work settles before the controller operation resolves

## ADDED Requirements

### Requirement: User-triggered sync has a bounded lifetime

The server SHALL give the sync-work portion of `POST /calendars/sync` an absolute 10-second deadline, leaving time inside the mobile client's 15-second request timeout to read and serialize last-known content. The same cancellation signal SHALL cover selection, queued concurrency work, and upstream fetches. Client disconnect SHALL trigger that cancellation. Cancellation SHALL stop new retries and SHALL NOT be converted into a normal upstream failure that advances the calendar's next planned sync.

#### Scenario: Request work reaches its deadline

- **WHEN** one or more calendar sources have not completed within 10 seconds of starting the batch operation
- **THEN** active upstream requests are aborted, queued calendars are skipped, and the response is built from the content safely committed before the deadline plus last-known content for the rest

#### Scenario: Client disconnects before completion

- **WHEN** the HTTP connection closes while calendar sync work is active
- **THEN** the server aborts the request's upstream work and does not continue retry chains detached from the ended HTTP span

#### Scenario: Cancellation happens before persistence

- **WHEN** an upstream fetch is cancelled before its result enters the persistence transaction
- **THEN** the calendar content, `lastUpdatedAt`, and `syncPlannedAt` remain unchanged

### Requirement: iCalendar fetching has an absolute retry budget

An iCalendar fetch SHALL have at most one attempt for normal sources and at most two attempts for retry-enabled sources. Each attempt SHALL receive the shared cancellation signal, no attempt SHALL wait more than seven seconds, and the entire retry-enabled operation SHALL stop after nine seconds even if an individual transport does not settle normally. Authentication failures that are not retryable SHALL still fail immediately.

#### Scenario: Retry-enabled source never responds

- **WHEN** a retry-enabled source does not return a usable response
- **THEN** no more than two transport attempts occur and the fetch settles within the nine-second absolute budget

#### Scenario: Request cancellation interrupts a retry

- **WHEN** the parent request cancellation signal fires during an iCalendar attempt or before its retry
- **THEN** Axios is aborted and no further attempt starts

#### Scenario: Basic-auth challenge is returned

- **WHEN** an upstream source returns the existing HTTP 401 basic-auth challenge
- **THEN** `IcalFetcher` preserves the current `CustomError` result and does not retry it

### Requirement: Sync candidates are selected without event content

The due-calendar selection query for a user-triggered sync SHALL load only the calendar fields and school relation required to fetch and persist a calendar. It SHALL NOT join, deserialize, or transform `calendar.content.events`. Existing content SHALL be read only inside the persistence transaction when a successful fetch must be diffed, while the final public response SHALL continue to load the requested calendars with their content.

#### Scenario: Due candidates include large stored calendars

- **WHEN** due calendars have large event arrays in `calendar.content`
- **THEN** candidate selection returns their sync metadata without selecting or running the JSON transformer for those arrays

#### Scenario: Successful sync still detects changes

- **WHEN** a metadata-only candidate fetches new events successfully
- **THEN** the persistence transaction loads the prior content under its existing lock, computes the same change result, and commits content and `CalendarLog` atomically

#### Scenario: Response contract is unchanged

- **WHEN** the bounded sync work finishes or reaches its deadline
- **THEN** the endpoint returns the same public calendar-and-events response shape using newly committed content where available and last-known content otherwise

### Requirement: Calendar-sync health is measurable and regression-tested

The server SHALL emit bounded-cardinality telemetry for batch duration, selected and started calendar counts, active upstream work, upstream attempts, phase duration, and cancellation outcome. Every process SHALL publish a distinct OTel service-instance identity so replica counters can be aggregated without reset collisions. The repository SHALL contain a production-safe representative load fixture and recorded baseline/fixed profile summaries containing no calendar token, full URL, credential, or event payload.

#### Scenario: A bounded batch is observed

- **WHEN** a user-triggered calendar sync completes, partially completes at its deadline, or is cancelled by disconnect
- **THEN** telemetry records its duration and bounded outcome plus the selected, started, completed, and cancelled work without user-controlled label values

#### Scenario: Replicas export counters

- **WHEN** three server replicas export the same calendar-sync counter name
- **THEN** each series has a distinct `service.instance.id` resource attribute and aggregation does not merge unrelated counter resets

#### Scenario: Representative load regression proof

- **WHEN** the checked-in load fixture runs with large event sets and more due calendars than the concurrency limit
- **THEN** it proves concurrency never exceeds three, no operation remains after request completion, response p95 remains below the 15-second client timeout, and maximum event-loop delay is lower than the recorded baseline

#### Scenario: Evidence is safe to retain

- **WHEN** trace and CPU profile results are committed to the investigation
- **THEN** they contain commands, aggregate dimensions, top frames, timings, and trace relationships but no raw token, query-bearing calendar URL, credential, or event content
