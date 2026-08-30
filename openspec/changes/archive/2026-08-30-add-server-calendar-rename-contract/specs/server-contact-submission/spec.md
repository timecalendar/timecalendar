## MODIFIED Requirements

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
