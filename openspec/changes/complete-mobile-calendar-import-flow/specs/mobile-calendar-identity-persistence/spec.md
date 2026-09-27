## MODIFIED Requirements

### Requirement: QR-scan and iCal-import success paths persist a durable calendar
A successful QR scan and a successful iCal submission SHALL persist a durable `user_calendars`
row through one shared staged operation. The operation SHALL create the server calendar, retain the
returned token as an attempt-bound in-memory checkpoint, resolve metadata through
`GET /calendars/by-token/{token}`, retain that DTO as the next checkpoint, and upsert the row. It
SHALL expose durable persistence as the completion boundary consumed by both source controllers.
It SHALL NOT write an ephemeral scanned-source holder, persist an unfinished checkpoint, or place
private checkpoint data in navigation.

A token-resolution or upsert failure SHALL be recorded through the `@/firebase` `recordError` seam
and surfaced as an accessible failure state. Retry during the mounted attempt SHALL resume the
first incomplete step and SHALL NOT issue another create request after a token is known. A
deliberately different URL/QR attempt or process death MAY abandon the in-memory checkpoint; this
capability does not claim server exactly-once behavior when a create response itself is lost.

#### Scenario: A successful add persists a durable row
- **WHEN** a QR or iCal attempt receives a token and its remaining steps succeed
- **THEN** metadata is resolved by token and a durable `user_calendars` row is upserted
- **AND** the operation reports durable completion exactly once with no ephemeral holder write

#### Scenario: A failed persist is recorded and surfaced
- **WHEN** create, token resolution, or the local durable upsert fails
- **THEN** the failure is recorded through the Firebase error seam and surfaced accessibly
- **AND** the source retains its draft and checkpoint for retry without reporting completion

#### Scenario: Resolve retry reuses the known token
- **WHEN** metadata resolution fails after create returned a token
- **THEN** the failure is recorded and surfaced accessibly
- **AND** Retry repeats the resolve call for that token without repeating `POST /calendars`

#### Scenario: Upsert retry reuses the resolved DTO
- **WHEN** local `user_calendars` upsert fails after metadata resolution
- **THEN** the local write failure is recorded and surfaced accessibly
- **AND** Retry repeats the upsert from the checkpointed DTO without repeating create or resolve

#### Scenario: A new attempt does not inherit a prior checkpoint
- **WHEN** the student deliberately scans another QR or submits a materially different URL after abandoning a failure
- **THEN** the previous attempt checkpoint is cleared and the new source starts at create
- **AND** no token or DTO from the prior source is reused

#### Scenario: Unfinished checkpoints are not durable
- **WHEN** the process exits before `user_calendars` commits
- **THEN** no MMKV value, SQLite row, or navigation parameter restores the unfinished checkpoint
- **AND** the system does not claim that a lost create response can be recovered without server idempotency

## ADDED Requirements

### Requirement: Checkpointed persistence is proven independently from source presentation
The shared add-calendar data/controller tests SHALL prove each stage, checkpoint resume, new-attempt
reset, exactly-once durable completion, and synchronous duplicate exclusion without depending on QR
camera or iCal form rendering.

#### Scenario: Every resume boundary is covered
- **WHEN** the checkpointed operation test suite runs
- **THEN** it proves create failure retries create, resolve failure retries resolve only, and upsert failure retries upsert only
- **AND** it asserts the exact create, resolve, and repository invocation counts

#### Scenario: Completion and reset are covered
- **WHEN** concurrent retry, successful settlement, or a materially new attempt is exercised
- **THEN** no concurrent invocation or duplicate completion occurs
- **AND** a new attempt starts without the abandoned checkpoint
