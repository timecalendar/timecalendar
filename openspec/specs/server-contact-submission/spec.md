# server-contact-submission Specification

## Purpose
Define privacy-bounded contact delivery, recoverable downstream failure semantics, and finite-cardinality observability for `POST /contact`.
## Requirements
### Requirement: Contact submissions deliver through privacy-bounded Crisp metadata

The server SHALL create a Crisp conversation, attach the submitted e-mail plus non-empty diagnostic metadata, and send the submitted message. Derived nickname and custom-data values SHALL be normalized before the metadata call; values that normalize to empty, including an empty derived nickname or an empty joined calendar-ID list, MUST be omitted rather than sent as invalid Crisp metadata. The server MUST NOT log, trace, or attach the submitted e-mail, message, calendar URL, calendar IDs, school identity, or device information to metrics.

The supported diagnostic metadata SHALL include an optional `calendarName`, carrying the calendar's programme name for an import report, and the legacy optional `gradeName`. Both fields SHALL be accepted independently and forwarded as distinct metadata keys; neither SHALL be derived from, or substituted for, the other. `calendarName` SHALL be additive: a request that omits it remains valid and produces no `calendarName` metadata key.

#### Scenario: Empty optional enrichment does not reject a valid submission

- **WHEN** a valid contact request has an e-mail whose derived nickname is empty, no calendar IDs, and no optional school or calendar context
- **THEN** the Crisp metadata call omits the empty nickname and empty custom-data values
- **AND** the message is still sent successfully

#### Scenario: Non-empty enrichment reaches Crisp

- **WHEN** a valid contact request contains non-empty supported diagnostic fields
- **THEN** the Crisp metadata call receives the normalized non-empty values and the message is sent unchanged

#### Scenario: Programme context is forwarded as its own metadata key

- **WHEN** a valid contact request supplies a non-empty `calendarName`
- **THEN** the Crisp metadata call receives it as a distinct `calendarName` key with its normalized value

#### Scenario: The legacy grade field remains independently supported

- **WHEN** a contact request supplies only `gradeName`, or supplies both `gradeName` and `calendarName`
- **THEN** each supplied field is forwarded under its own metadata key
- **AND** neither field is copied into or inferred from the other

#### Scenario: Observability contains no submitted content or identity

- **WHEN** a contact submission succeeds or any Crisp stage fails
- **THEN** server logs, traces added by this feature, and metric attributes contain no submitted field values or downstream session identifier

### Requirement: Downstream contact failures are explicit and recoverable

The server SHALL classify failures from conversation creation, metadata update, and message send without exposing the Crisp response or submitted data. Any such downstream failure SHALL return HTTP `503 Service Unavailable` with a static response safe for display/telemetry; validation failures SHALL remain HTTP `400`, and successful delivery SHALL remain HTTP `201`.

#### Scenario: Crisp metadata rejects a request

- **WHEN** conversation creation succeeds but Crisp rejects the metadata update
- **THEN** the endpoint returns a static HTTP 503 response
- **AND** it does not attempt to send the message after the failed prerequisite
- **AND** neither the Crisp error payload nor any submitted field appears in the response

#### Scenario: Crisp message delivery fails

- **WHEN** Crisp accepts conversation creation and metadata but rejects message delivery
- **THEN** the endpoint returns the same static HTTP 503 response
- **AND** records the failure as the message-send stage without submitted data

#### Scenario: Successful delivery preserves the public success contract

- **WHEN** all three Crisp operations succeed
- **THEN** `POST /contact` returns HTTP 201 with no response body

### Requirement: Contact delivery emits a bounded outcome metric

The server SHALL increment one `contact_submissions_total` counter exactly once per endpoint attempt. Its attributes SHALL be restricted to `result` (`success` or `error`) and `stage` (`complete`, `create`, `metadata`, or `message`); raw exception names/messages, HTTP payloads, session identifiers, and submitted fields MUST NOT be metric attributes.

#### Scenario: Successful contact metric

- **WHEN** Crisp sends the submitted message
- **THEN** the counter increments once with `result=success` and `stage=complete`

#### Scenario: Failed contact metric

- **WHEN** a Crisp operation rejects
- **THEN** the counter increments once with `result=error` and the matching bounded stage
- **AND** no success increment is emitted for that attempt

### Requirement: The committed contract documents contact unavailability

The committed OpenAPI document SHALL describe HTTP 201 success, HTTP 400 request validation, and HTTP 503 downstream unavailability for `POST /contact`. Generated clients SHALL be regenerated from the committed document and MUST NOT be hand-edited.

#### Scenario: Response semantics change

- **WHEN** the server OpenAPI document is generated after this repair
- **THEN** `openapi/openapi.json` includes the contact 503 response without a submitted-data schema
- **AND** regenerating `mobile/src/api/generated/` produces no uncommitted drift

