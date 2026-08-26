## ADDED Requirements

### Requirement: Calendar creation classifies failures with a closed recovery model

The server SHALL classify a failed calendar creation as exactly one of
`unsupported_link`, `upstream_unavailable`, `invalid_calendar`, or `unknown`, select an
allowlisted help key, and derive retryability from that classification. Classification
SHALL use normalized school code, hostname, path shape, query-key presence, and structured
fetch outcomes only; it MUST NOT copy or inspect query values, credentials, timetable
resource identifiers, or raw exception messages.

#### Scenario: Unsupported school page is rejected before upstream fetch

- **WHEN** a submitted URL matches a cataloged school login, encrypted portal, timetable
  UI, direct-view, or dead short-link shape and does not match that school's supported
  export shape
- **THEN** creation fails as `unsupported_link` with that school's export-help key and
  `retryable: false`
- **AND** no upstream request is made

#### Scenario: Provider failure remains distinct from an unsupported shape

- **WHEN** a supported export URL encounters a timeout, DNS/TLS failure, HTTP 5xx, or a
  cataloged zero-byte upstream incident
- **THEN** creation fails as `upstream_unavailable` with the applicable school outage-help
  key and `retryable: true`

#### Scenario: Unknown input fails safely

- **WHEN** no catalog rule safely identifies the school/mode or the structured outcome is
  not recognized
- **THEN** the server returns the bounded `unknown` recovery model
- **AND** it does not expose the submitted URL or raw error detail

### Requirement: Required school recovery modes are cataloged without blocking exports

The recovery catalog SHALL cover Rennes, Tours, Réunion, Montpellier, UBE, Lyon 2,
Saint-Étienne, Bordeaux INP, and Toulouse 3. Every host-level rule SHALL prove at least
one supported export shape is not rejected, where a supported export shape is known.

#### Scenario: Rennes current host selects its strategy

- **WHEN** a valid calendar export uses `planning.univ-rennes.fr`
- **THEN** it matches the Rennes strategy and proceeds through the normal URL transforms
  and fetch path

#### Scenario: Rennes direct UI is not treated as an export

- **WHEN** a Rennes URL on the current host uses the `/direct/` web-UI shape
- **THEN** it is classified `unsupported_link` with Rennes-specific export guidance
- **AND** it is not fetched as iCal

#### Scenario: Web UI and encrypted cohorts receive school export help

- **WHEN** a URL matches the documented Tours login/short-link, Réunion timetable UI,
  Montpellier encrypted direct UI, UBE portal/encrypted UI, or Lyon 2 encrypted data UI
  shape
- **THEN** it is classified `unsupported_link` with the matching school-specific help key
  and `retryable: false`

#### Scenario: Documented outage cohorts receive outage help

- **WHEN** Saint-Étienne returns its documented zero-byte response, or a supported
  Bordeaux INP or Toulouse 3 export encounters the documented TLS/HTTP 5xx failure
- **THEN** it is classified `upstream_unavailable` with the matching school-specific help
  key and `retryable: true`
- **AND** TLS verification remains enabled

#### Scenario: Empty valid calendars are not globally reclassified

- **WHEN** an otherwise unrecognized source parses as an empty but structurally valid
  VCALENDAR
- **THEN** the server follows the existing empty-calendar rejection behavior with bounded
  generic recovery
- **AND** it does not infer a school outage solely from zero events

### Requirement: Failed calendar creation exposes typed safe recovery metadata

The calendar-create OpenAPI operation SHALL document its failure body as a generated DTO
containing only `code: "calendar_import_failed"`, the closed classification, an allowlisted
help key, and a boolean retryable flag. The response MUST NOT include a URL, hostname,
path, query value, school database ID, timetable resource ID, credential, exception
message, or stack.

#### Scenario: Typed unsupported-link response

- **WHEN** a cataloged unsupported link is submitted to `POST /calendars`
- **THEN** the non-2xx JSON body conforms to the documented recovery DTO
- **AND** the committed OpenAPI document and generated mobile client expose that DTO

#### Scenario: Response contains only closed fields

- **WHEN** any classified creation failure is serialized
- **THEN** its object keys are exactly the documented safe fields
- **AND** synthetic credentials/resource values from the request and upstream error are
  absent from the serialized body

### Requirement: Calendar failure diagnostics retain only bounded safe keys

Server persistence, logs, metrics, and trace attributes for failed calendar creation SHALL
contain only allowlisted school code, classification, help key, retryability, action/status,
and bounded error-kind values. They MUST NOT contain the submitted URL or hostname,
path/query values, raw exception message/stack, credentials, calendar token/ID, school
database ID, or timetable resource ID.

#### Scenario: Failure persistence accepts no raw source

- **WHEN** calendar creation fails for a URL containing synthetic credentials and resource
  identifiers
- **THEN** the failure repository is called with the bounded recovery record only
- **AND** its public API accepts neither a URL nor an `Error` object

#### Scenario: Metrics are bounded

- **WHEN** success and failure counters are emitted for calendar creation
- **THEN** label keys and values come from the allowlisted bounded model
- **AND** no source-domain label or URL-derived value is emitted

#### Scenario: Development API diagnostics redact bodies

- **WHEN** a development build sends and receives the calendar-create request
- **THEN** API diagnostics may include method, safe route, and status
- **AND** request/response bodies are not printed

### Requirement: Legacy raw calendar failures are scrubbed by a privacy migration

A server migration SHALL remove or irreversibly redact existing raw calendar-failure URL
and error content, establish the bounded diagnostic shape, and prevent new raw values from
being stored. Its `down` path MUST NOT reconstruct scrubbed sensitive content.

#### Scenario: Migration scrubs existing sensitive rows

- **WHEN** the migration runs over synthetic legacy rows whose URL/error contain a login,
  password, resource ID, and raw URL
- **THEN** no forbidden synthetic value remains in the migrated table
- **AND** only bounded recovery fields or explicit redacted placeholders remain

#### Scenario: Migration round trip preserves privacy

- **WHEN** the PostgreSQL-backed migration proof runs `up`, `down`, and the supported
  forward path
- **THEN** schema expectations pass at each stage
- **AND** no stage restores or permits the original sensitive strings

