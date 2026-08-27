# server-calendar-sync-policy Specification

## Purpose
How often the server is allowed to fetch a stored calendar's upstream source, how that
cadence is configured per university, and how the next fetch is planned and persisted.
## Requirements
### Requirement: A minimum interval between upstream fetches of the same calendar

The server SHALL NOT fetch a stored calendar's upstream source more often than that
calendar's minimum sync interval, regardless of how often clients call the sync endpoint,
how many replicas select it, or whether a background job is retried. The interval SHALL be
enforced server-side on every automatic sync entry point—the user-triggered batch sync and
the background job alike—through an atomic persisted claim before upstream I/O, and SHALL
NOT be overridable by a client request.

#### Scenario: A recently synced calendar is not re-fetched

- **WHEN** `POST /calendars/sync` is called for a calendar whose last upstream claim is
  more recent than its minimum sync interval
- **THEN** no request is made to the calendar's upstream source, and the calendar is still
  returned to the client with its last-known content

#### Scenario: An outdated calendar is atomically claimed and fetched

- **WHEN** `POST /calendars/sync` is called for a calendar whose planned sync date has
  passed
- **THEN** exactly one caller atomically advances the plan, fetches the upstream source,
  stores the result, and leaves the next sync planned no earlier than one interval later

#### Scenario: Concurrent callers select the same due calendar

- **WHEN** two replicas or a user request and background job concurrently attempt the same
  due calendar
- **THEN** one atomic claim succeeds and at most one upstream fetch occurs during the
  interval

#### Scenario: The background job honours the same interval

- **WHEN** the calendar sync job runs or retries
- **THEN** it uses the same atomic per-calendar claim as the user-triggered path, so a
  stored or retried job cannot fetch a calendar before its plan is due

#### Scenario: A failed sync still consumes the interval

- **WHEN** an existing calendar's upstream fetch or later persistence fails after its claim
- **THEN** the claimed next-sync date remains in force, so a retry or client request does
  not fetch that university again before the interval

### Requirement: The minimum sync interval is configured per university

The minimum sync interval SHALL be a property of the school strategy that the fetch layer
already resolves for a calendar — by the school code the user selected **or** by matching the
calendar URL — so that a university which asks us to reduce our request frequency is
configured in exactly one place, alongside the rest of that university's fetch configuration.
A strategy that does not declare an interval SHALL use the default interval of 30 minutes.
The interval value SHALL be declared in code: no database column holds the policy, and it is
not runtime-configurable.

#### Scenario: A university with a declared interval is throttled to it

- **WHEN** a calendar resolves to a school strategy declaring a minimum sync interval of 60
  minutes, and it was last synced 45 minutes ago
- **THEN** the calendar is not re-fetched, and it becomes eligible again 60 minutes after that
  last sync

#### Scenario: The university is recognised by URL as well as by school code

- **WHEN** a calendar carries no school relation but its URL matches a strategy declaring a
  minimum sync interval
- **THEN** that strategy's interval applies, exactly as it would for a calendar whose selected
  school code matches the strategy

#### Scenario: Other universities keep the default interval

- **WHEN** a calendar resolves to a strategy that declares no minimum sync interval (including
  the generic strategy)
- **THEN** the default 30-minute interval applies, unchanged from before this capability
  existed

### Requirement: Université Lyon 1 is capped at one upstream fetch per hour per calendar

Calendars served by Université Lyon 1 SHALL declare a minimum sync interval of 60 minutes,
at that university's request. A calendar SHALL be recognised as Lyon 1's by its URL, so
that the cap applies whether or not the user selected Lyon 1 as their school. Migration of
an existing calendar, concurrent callers, and background retry SHALL preserve the same
one-fetch-per-hour limit.

#### Scenario: A Lyon 1 calendar resolves to a 60-minute interval

- **WHEN** the minimum sync interval is resolved for a calendar whose URL is a Université
  Lyon 1 calendar URL, or whose selected school is Université Lyon 1
- **THEN** the resolved interval is 60 minutes

#### Scenario: A calendar from another university is unaffected after its first migration cycle

- **WHEN** the minimum sync interval is resolved for a calendar whose URL resembles a
  Lyon 1 URL but is served by a different host
- **THEN** the resolved runtime interval is the 30-minute default

#### Scenario: First post-migration wave preserves the Lyon limit

- **WHEN** an existing calendar is backfilled by
  `1787641039755-AddCalendarSyncPlannedAt`
- **THEN** it is not planned earlier than 60 minutes after `lastUpdatedAt`, so a Lyon 1
  calendar cannot enter the first fan-out wave before its hour elapses

#### Scenario: A failed Lyon job is retried

- **WHEN** a Lyon 1 background job has already made an upstream request and then fails or
  is retried by BullMQ
- **THEN** the persisted claim prevents another upstream fetch until the 60-minute plan is
  due

### Requirement: The next sync date is planned per calendar and stored

Each calendar SHALL carry the date at which it may next be fetched upstream. That date SHALL
be written when a sync completes, as the time of that sync plus the interval resolved for the
calendar at that moment, and selection of calendars to sync SHALL be a single query on that
stored date. Selection SHALL NOT resolve school strategies, and SHALL NOT load calendars it
then discards.

A calendar whose planned date is missing SHALL be treated as due immediately, so that a
calendar can never become permanently ineligible for syncing.

#### Scenario: Selection is one query on the planned date

- **WHEN** calendars are selected for a sync
- **THEN** exactly the calendars whose planned sync date has passed are loaded — subject to the
  inactivity and token bounds — with no per-calendar strategy resolution and no additional
  query

#### Scenario: A newly created calendar is planned from its own university's interval

- **WHEN** a calendar is created for a university declaring a 60-minute interval
- **THEN** its upstream source is fetched immediately as part of creation, and its next sync is
  planned 60 minutes later

#### Scenario: An interval change takes effect from the next sync

- **WHEN** a university's declared interval changes and a calendar already has a planned sync
  date computed from the previous interval
- **THEN** that pending date is honoured as-is, and the new interval applies from that
  calendar's next completed sync onwards

### Requirement: Creating a calendar is not throttled

Creating a calendar SHALL fetch its upstream source immediately, regardless of any minimum
sync interval, because the calendar has no content yet and the fetch result determines whether
creation succeeds.

#### Scenario: A new calendar is fetched on creation

- **WHEN** `POST /calendars` is called with a URL belonging to a university that declares a
  longer minimum sync interval
- **THEN** the source is fetched immediately and the calendar is created with its content

### Requirement: Inactive calendars are excluded from automatic syncs

The background sync SHALL skip calendars that have not been accessed within the inactivity
window (14 days), so that abandoned calendars stop generating upstream requests. The
user-triggered sync SHALL ignore this bound, since the request itself proves the calendar is
in use.

#### Scenario: An abandoned calendar is not synced by the job

- **WHEN** the sync job runs and a calendar's `lastAccessedAt` is older than the inactivity
  window
- **THEN** the calendar is not fetched

#### Scenario: Opening the app revives an inactive calendar

- **WHEN** a client syncs a calendar whose `lastAccessedAt` is older than the inactivity
  window
- **THEN** the calendar is eligible for sync (subject to its minimum sync interval) and its
  `lastAccessedAt` is refreshed

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
