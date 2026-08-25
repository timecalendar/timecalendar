## ADDED Requirements

### Requirement: A minimum interval between upstream fetches of the same calendar

The server SHALL NOT fetch a stored calendar's upstream source more often than that
calendar's minimum sync interval, regardless of how often clients call the sync endpoint.
The interval SHALL be enforced server-side on every automatic sync entry point — the
user-triggered batch sync and the background job alike — and SHALL NOT be overridable by a
client request.

#### Scenario: A recently synced calendar is not re-fetched

- **WHEN** `POST /calendars/sync` is called for a calendar whose last sync is more recent than
  its minimum sync interval
- **THEN** no request is made to the calendar's upstream source, and the calendar is still
  returned to the client with its last-known content and an unchanged `lastUpdatedAt`

#### Scenario: An outdated calendar is re-fetched

- **WHEN** `POST /calendars/sync` is called for a calendar whose last sync is older than its
  minimum sync interval
- **THEN** the upstream source is fetched, the stored content is replaced, `lastUpdatedAt` is
  set to now, and the next sync is planned one interval later

#### Scenario: The background job honours the same interval

- **WHEN** the calendar sync job runs
- **THEN** it selects calendars using the same per-calendar minimum sync interval as the
  user-triggered path, so no entry point can fetch a calendar sooner than its interval allows

#### Scenario: A failed sync still consumes the interval

- **WHEN** an existing calendar's upstream source fails to respond during a sync
- **THEN** the calendar's next sync is planned one interval later, exactly as for a successful
  sync, so a failing university is not retried on every client request

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

Calendars served by Université Lyon 1 SHALL declare a minimum sync interval of 60 minutes, at
that university's request. A calendar SHALL be recognised as Lyon 1's by its URL, so that the
cap applies whether or not the user selected Lyon 1 as their school.

#### Scenario: A Lyon 1 calendar resolves to a 60-minute interval

- **WHEN** the minimum sync interval is resolved for a calendar whose URL is a Université
  Lyon 1 calendar URL, or whose selected school is Université Lyon 1
- **THEN** the resolved interval is 60 minutes

#### Scenario: A calendar from another university is unaffected

- **WHEN** the minimum sync interval is resolved for a calendar whose URL resembles a Lyon 1
  URL but is served by a different host
- **THEN** the resolved interval is the 30-minute default

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

The server SHALL bound the number of upstream calendar fetches it performs concurrently
within a single sync run, and a failure to fetch one calendar SHALL NOT abort the others.

#### Scenario: One failing calendar does not fail the batch

- **WHEN** a batch sync includes a calendar whose upstream source errors
- **THEN** the remaining calendars are still synced, and the failing calendar is returned with
  its last-known content
