## ADDED Requirements

### Requirement: A minimum interval between upstream fetches of the same calendar

The server SHALL NOT fetch a stored calendar's upstream source more often than that
calendar's minimum sync interval, regardless of how often clients call the sync endpoint.
The interval SHALL be enforced server-side on every automatic sync entry point — the
user-triggered batch sync and the background job alike — and SHALL NOT be overridable by a
client request.

#### Scenario: A recently updated calendar is not re-fetched

- **WHEN** `POST /calendars/sync` is called for a calendar whose `lastUpdatedAt` is more
  recent than its minimum sync interval
- **THEN** no request is made to the calendar's upstream source, and the calendar is still
  returned to the client with its last-known content and an unchanged `lastUpdatedAt`

#### Scenario: An outdated calendar is re-fetched

- **WHEN** `POST /calendars/sync` is called for a calendar whose `lastUpdatedAt` is older
  than its minimum sync interval
- **THEN** the upstream source is fetched, the stored content is replaced, and
  `lastUpdatedAt` is set to now

#### Scenario: The background job honours the same interval

- **WHEN** the calendar sync job runs
- **THEN** it selects calendars using the same per-calendar minimum sync interval as the
  user-triggered path, so no entry point can fetch a calendar sooner than its interval allows

### Requirement: The minimum sync interval is configured per university

The minimum sync interval SHALL be a property of the school strategy that the fetch layer
already resolves for a calendar — by the school code the user selected **or** by matching the
calendar URL — so that a university which asks us to reduce our request frequency is
configured in exactly one place, alongside the rest of that university's fetch configuration.
A strategy that does not declare an interval SHALL use the default interval of 30 minutes.
The interval SHALL be declared in code (no database column, no migration, no runtime
configuration).

#### Scenario: A university with a declared interval is throttled to it

- **WHEN** a calendar resolves to a school strategy declaring a minimum sync interval of 60
  minutes, and its `lastUpdatedAt` is 45 minutes old
- **THEN** the calendar is not re-fetched, and it becomes eligible again once `lastUpdatedAt`
  is older than 60 minutes

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

Calendars served by Université Lyon 1 SHALL declare a minimum sync interval of 60 minutes, at
that university's request.

#### Scenario: A Lyon 1 calendar resolves to a 60-minute interval

- **WHEN** the minimum sync interval is resolved for a calendar whose URL is a Université
  Lyon 1 calendar URL, or whose selected school is Université Lyon 1
- **THEN** the resolved interval is 60 minutes

### Requirement: Selecting calendars to sync stays a single indexed query

Applying per-university intervals SHALL NOT turn calendar selection into a per-calendar
database round trip. The server SHALL select candidates with one query bounded by the
**smallest** interval any strategy declares, then discard candidates whose own interval has
not yet elapsed.

#### Scenario: The candidate query is a superset

- **WHEN** calendars are selected for a sync
- **THEN** the database query filters on the smallest interval declared by any strategy — so
  no calendar that is due under its own interval can be excluded by the query — and the
  per-calendar interval is applied to the rows already loaded, with no additional query

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

The server SHALL bound the number of upstream calendar fetches it performs concurrently
within a single sync run, and a failure to fetch one calendar SHALL NOT abort the others.

#### Scenario: One failing calendar does not fail the batch

- **WHEN** a batch sync includes a calendar whose upstream source errors
- **THEN** the remaining calendars are still synced, and the failing calendar is returned with
  its last-known content
