## ADDED Requirements

### Requirement: Known school import sources are classified without inspecting secrets

The server SHALL classify supported school hosts and link shapes from parsed hostname,
path, and query-key names only. It MUST NOT use, return, log, persist, or emit query values,
credentials, calendar resource identifiers, or upstream response bodies as classification
metadata.

#### Scenario: Rennes new host uses the Rennes strategy

- **WHEN** a direct iCal feed URL on `planning.univ-rennes.fr` is submitted
- **THEN** the Rennes strategy matches the source just as it does the prior Rennes host
- **AND** the feed proceeds through the normal fetch path

#### Scenario: Recognized web-UI and encrypted shapes are unsupported

- **WHEN** the server receives a documented web-UI/login/encrypted/dead-short-link shape for Rennes, Tours, Réunion, Montpellier, UBE, or Lyon 2
- **THEN** it classifies the request as `unsupported_link` before an outbound fetch
- **AND** the classification identifies the school and either `export_ical` or `export_or_renew_link` help

#### Scenario: Recognized school feed failure is an upstream outage

- **WHEN** a recognized feed shape for Saint-Étienne, Bordeaux INP, or Toulouse 3 fails to fetch, parse, or produce events
- **THEN** the server classifies it as `upstream_unavailable` with `retry_later` help

#### Scenario: Unknown source retains generic behavior

- **WHEN** a source does not match a documented school host and shape
- **THEN** the existing generic fetch/error behavior remains in effect
- **AND** the server does not guess a school or remediation

### Requirement: Calendar creation exposes a closed recovery error contract

`POST /calendars` SHALL return a documented `CalendarImportErrorDto` for recognized
recovery cases. The DTO SHALL contain only the closed `code`, `school`, and `help` enums
and MUST NOT contain a URL, query string, credential, resource id, upstream body, or
free-form upstream error message.

#### Scenario: Unsupported link response

- **WHEN** calendar creation receives a recognized unsupported link shape
- **THEN** it responds with HTTP 422 and `code: unsupported_link`
- **AND** its body carries only the matching school and help enum values

#### Scenario: Upstream unavailable response

- **WHEN** calendar creation fails for a recognized school feed whose upstream is unavailable
- **THEN** it responds with HTTP 502 and `code: upstream_unavailable`
- **AND** its body carries only the matching school and `retry_later` help value

#### Scenario: Successful create is unchanged

- **WHEN** a supported feed imports successfully
- **THEN** `POST /calendars` retains its existing success response containing the calendar token

### Requirement: Import failure diagnostics are source-safe

The server SHALL record only allowlisted, non-secret import diagnostics. New calendar
creation failure records and telemetry MUST NOT contain the submitted source URL, query
string, credentials, resource identifiers, upstream body, stack, or arbitrary error
message.

#### Scenario: Classified failure is persisted safely

- **WHEN** a classified calendar creation fails
- **THEN** the failure record contains at most the parsed hostname and allowlisted error name/code/school/help fields
- **AND** no database schema migration is required

#### Scenario: Generic failure is persisted safely

- **WHEN** an unclassified calendar creation fails
- **THEN** its new failure record contains the parsed hostname and bounded error class only
- **AND** it does not persist the full source URL or raw exception fields

#### Scenario: Metrics exclude secret dimensions

- **WHEN** import success or failure telemetry is emitted
- **THEN** metric dimensions are bounded to school, hostname, action, status, and stable error category
- **AND** query/path values and resource identifiers are absent

### Requirement: Server recovery behavior is deterministically tested

Focused server tests SHALL cover every named school mode using synthetic, secret-free
fixtures and mocked fetch responses, without contacting a live university service.

#### Scenario: Complete school matrix proof

- **WHEN** the classifier/service test suite runs
- **THEN** it covers Rennes, Tours, Réunion, Montpellier, UBE, Lyon 2, Saint-Étienne, Bordeaux INP, and Toulouse 3
- **AND** it asserts the code, school, help, HTTP status, Rennes strategy match, unknown fallback, and sanitized persistence behavior

#### Scenario: No sensitive fixture values

- **WHEN** recovery tests and snapshots are inspected
- **THEN** they contain no real URL copied from production, password, encrypted token, calendar resource id, or customer data
