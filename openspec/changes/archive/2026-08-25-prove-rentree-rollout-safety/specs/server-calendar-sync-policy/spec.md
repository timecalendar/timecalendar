## MODIFIED Requirements

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
