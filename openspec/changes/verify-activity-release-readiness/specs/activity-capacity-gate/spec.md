## ADDED Requirements

### Requirement: Release measurement exercises the shipped HTTP route

The Activity release review SHALL measure `POST /v1/calendar-logs/search` through the real Nest
controller, service, repository, mapper and response serializer against deterministic local
fixtures. It SHALL measure first and following pages at limits 50 and 100, unread counts, and
representative concurrent requests without printing request or response bodies.

#### Scenario: Route latency is evaluated against G1, G2 and G4

- **WHEN** the full-scale release harness runs against the seeded local corpus
- **THEN** the record reports route-level p95 latency for 50-row pages, 100-row pages and unread
  counts against the frozen thresholds

#### Scenario: Route proof and SQL proof remain distinct

- **WHEN** route-level measurements pass
- **THEN** the release record still includes the fixture-only planner and query-shape evidence
  required by the capacity gate

### Requirement: The shipped route and capacity harness share the lateral query source

The route-level proof SHALL demonstrate that `CalendarLogRepository.searchPage` imports the
production-owned `calendarLogPageLateralSql` used by the capacity harness. The release tooling MUST
NOT copy or reimplement the page query.

#### Scenario: The query source is inspected and exercised

- **WHEN** the release harness evaluates the shipped route
- **THEN** a focused proof confirms the repository and harness both resolve the same lateral query
  export

#### Scenario: A private harness query is introduced

- **WHEN** release tooling copies or reimplements the page SQL instead of importing the shared
  export
- **THEN** the focused proof fails

### Requirement: G3 and G3a are both evaluated on bounded token requests

The release review SHALL fail G3 when a bounded token request performs a full-table sequential
scan and SHALL fail G3a when it performs a full global-index walk. Plans SHALL be captured only
against synthetic fixtures and redacted before output.

#### Scenario: The lateral plan stays bounded

- **WHEN** the one-, ten-, one-hundred- and empty-calendar cohorts are explained
- **THEN** no plan performs a full `calendar_log` sequential scan or a full global-index walk

#### Scenario: G3 passes but the global index is exhausted

- **WHEN** a bounded plan avoids a sequential scan but walks the full global index
- **THEN** G3a fails and the release disposition is `NO-GO`

### Requirement: Runtime health and page-size evidence are reconciled

The release record SHALL report representative concurrent route results, event-loop delay and
memory growth for G6. It SHALL report measured serialized v1 bytes for the candidate and reconcile
them with the page-size projection for G7, including p50, p95, p99 and worst-case values at limits
50 and 100.

#### Scenario: Representative concurrency remains bounded

- **WHEN** the documented concurrent-read workload runs through the candidate route
- **THEN** the record reports completed/error counts, latency distribution, event-loop delay and
  heap change and evaluates them against G6

#### Scenario: Projection and candidate measurement disagree materially

- **WHEN** measured serialized v1 page bytes no longer support the frozen page-size verdict
- **THEN** G7 fails and the review does not silently retain the previous projection

### Requirement: G8 is proven at the mobile request boundary

The release review SHALL exercise overlapping push, successful-sync, screen-open and foreground
triggers through the real Activity coordinator boundary and SHALL observe exactly one newest-page
request. A later trigger after settlement SHALL issue a new request.

#### Scenario: Four triggers overlap one in-flight refresh

- **WHEN** the four accepted trigger sources overlap while one newest-page request is pending
- **THEN** exactly one `/v1/calendar-logs/search` request is observed and all observing callers
  receive the shared outcome

#### Scenario: A later trigger occurs after settlement

- **WHEN** a new forced trigger fires after the previous shared request has settled
- **THEN** one new request is issued, proving collapse is single-flight rather than permanently
  cached

### Requirement: Capacity evidence is candidate-bound and fail-closed

Every G1–G9 and G3a result in the readiness record SHALL be regenerated for the selected
code/configuration candidate whenever its validity depends on the head. Historical values MAY
appear only as labelled comparison data and MUST NOT satisfy a candidate gate.

#### Scenario: A current result is unavailable

- **WHEN** a required capacity or mobile gate has only evidence from another commit
- **THEN** that gate fails for the selected candidate and the readiness disposition is `NO-GO`
