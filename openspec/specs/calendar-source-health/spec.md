# calendar-source-health Specification

## Purpose
TBD - created by archiving change detect-stale-calendar-sources. Update Purpose after archive.
## Requirements
### Requirement: Batch sync returns a safe source-health contract per calendar

Each calendar returned by `POST /calendars/sync` SHALL include a `sourceHealth` object with
typed `status`, nullable `reason`, nullable `recoveryAction`, and nullable `guide` fields.
The supported statuses SHALL be `healthy`, `unknown`, and `stale`; stale reasons SHALL be
`expired_export_window` and `known_source_transition`; the recovery action SHALL be
`re_add`; and the AMU guide SHALL be `amu_2026_2027`. The object SHALL NOT contain a feed
URL, query value, calendar token, raw upstream error, or arbitrary display text.

#### Scenario: Stale metadata is returned beside last-good content
- **WHEN** a calendar is conclusively classified stale and batch sync returns it
- **THEN** its last-good events are returned unchanged together with typed stale reason and
  recovery codes
- **AND** `sourceHealth` contains no URL, query value, token, or raw error

#### Scenario: Uncertain source is not presented as stale
- **WHEN** the classifier has no conclusive positive or stale rule
- **THEN** the response carries `status: unknown` with null reason, action, and guide

#### Scenario: Existing clients remain compatible
- **WHEN** an older client reads the additive batch-sync response
- **THEN** the existing calendar and event fields retain their prior shape and semantics

### Requirement: Stale classification requires strong, deterministic evidence

The server SHALL classify source health with a pure clock-injected classifier. A known
source-transition rule SHALL take priority. Otherwise an explicit `lastDate` older than a
14-day grace period SHALL be stale only when the latest successful content-change timestamp
is absent or does not post-date the expired window plus grace. Age of the last change alone
SHALL NOT classify a source stale. Invalid or weak evidence SHALL produce `unknown`.

#### Scenario: Expired window with no later successful change is stale
- **WHEN** a source has a valid explicit `lastDate` more than 14 days in the past and no
  successful content change after the window plus grace
- **THEN** it is classified `stale / expired_export_window / re_add`

#### Scenario: Recent change age alone is not a stale rule
- **WHEN** a calendar has not changed recently but has no expired-window or known-transition
  evidence
- **THEN** it is not classified stale

#### Scenario: Malformed or ambiguous source evidence is safe
- **WHEN** URL parsing fails, `lastDate` is invalid, or the evidence is otherwise incomplete
- **THEN** classification does not throw, log the source, or return source fragments
- **AND** the result is `unknown`

### Requirement: AMU's retired source receives explicit recovery guidance

The reviewed source-rule registry SHALL recognize AMU's retired 2025–26 source by the old
host/year characteristics, not merely by the AMU school identity, and SHALL return
`stale / known_source_transition / re_add / amu_2026_2027`. The current AMU host SHALL not
match that stale rule.

#### Scenario: Retired AMU source is stale
- **WHEN** an AMU calendar matches the retired host/year rule
- **THEN** it receives the AMU 2026–27 re-add guide code

#### Scenario: Current AMU host is a near miss
- **WHEN** an AMU calendar uses the current host rather than the retired host
- **THEN** the retired-source rule does not classify it stale

#### Scenario: AMU school identity alone is insufficient
- **WHEN** a calendar is associated with AMU but its source does not match the retired rule
- **THEN** it does not receive `known_source_transition`

### Requirement: Source-health evidence is loaded without an N-plus-one query

For a batch response, the server SHALL load the latest successful calendar-change timestamp
for all returned calendar IDs with one grouped, bounded repository query and SHALL classify
the calendars in memory. The query SHALL project timestamps only and SHALL NOT hydrate full
calendar-change JSON.

#### Scenario: Multi-calendar batch uses one evidence query
- **WHEN** batch sync returns multiple calendars
- **THEN** the calendar-log repository executes one grouped latest-change query for their IDs
- **AND** no per-calendar log query or full change-payload hydration occurs

### Requirement: Detection never mutates a calendar source or content

Classification SHALL be read-only. An empty/erroring upstream fetch SHALL continue to keep
the stored last-good content, and neither classification nor recovery metadata SHALL rewrite
the stored URL, delete the calendar, clear events, or enqueue a backfill.

#### Scenario: Empty sync preserves old content and signals recovery
- **WHEN** an existing stale source returns no events during sync
- **THEN** the server retains and returns its previous content and source identity
- **AND** the response carries the stale recovery signal

#### Scenario: No migration side effect
- **WHEN** the stale-source capability is deployed
- **THEN** it performs no bulk update, URL rewrite, calendar deletion, or production backfill

### Requirement: Classifier and contract behavior are covered by backend tests

Server tests SHALL cover clock boundaries, valid/invalid `lastDate` parsing, missing/newer
change evidence, AMU retired/current host near misses, read-only empty-sync behavior, DTO
serialization, and the grouped repository query shape. Tests and diagnostics SHALL use
sanitized fixture URLs/tokens and SHALL not print production source material.

#### Scenario: Backend proof suite runs in CI
- **WHEN** the server Jest and OpenAPI drift checks run
- **THEN** the classifier boundary matrix, aggregate query, last-good-content behavior, and
  URL-free generated response schema are enforced
