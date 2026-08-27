## ADDED Requirements

### Requirement: Successful sync refreshes a rebuildable source-health snapshot

After a successful batch response and event replacement, the mobile sync data layer SHALL
validate/map every returned `sourceHealth` object and replace a
single namespaced MMKV snapshot keyed by calendar ID through the `@/storage` seam. The
snapshot SHALL store only calendar IDs and typed health/recovery codes; it SHALL never store
feed URLs or tokens. Entries absent from the response SHALL be pruned.

#### Scenario: Event and health snapshots refresh after success
- **WHEN** batch sync succeeds and local event replacement succeeds
- **THEN** the event cache is replaced first and the source-health snapshot is then replaced
  with the mapped response values

#### Scenario: Snapshot contains no source credentials
- **WHEN** source health is serialized locally
- **THEN** the JSON contains calendar IDs and typed enum codes only, with no URL or token

#### Scenario: Removed calendar health is pruned
- **WHEN** a previously known calendar ID is absent from a successful batch response
- **THEN** its source-health entry is absent from the replacement snapshot

### Requirement: Source-health reads are total and offline-safe

The calendar-sources store SHALL expose imperative and reactive reads through the storage
seam. Missing, malformed, or future unknown enum values SHALL decode to `unknown` and SHALL
never throw or hide cached events. The latest valid snapshot SHALL survive restart and be
available offline until a later successful sync replaces it.

#### Scenario: Corrupt health JSON degrades safely
- **WHEN** the stored snapshot is invalid JSON or fails field validation
- **THEN** the read returns no stale action, does not throw, and cached events still render

#### Scenario: Health remains available offline after restart
- **WHEN** a valid health snapshot was written, the process restarts, and the next sync fails
- **THEN** the prior snapshot remains readable while the last-good event rows render

### Requirement: Failed sync paths preserve prior event and health snapshots

A request failure or local event-replacement failure SHALL leave both prior snapshots
unchanged. A source-health MMKV write failure SHALL be recorded as a local persistence error
through `@/firebase`; it SHALL not delete event rows or expose source material in the report.

#### Scenario: Network failure preserves both snapshots
- **WHEN** the batch request rejects
- **THEN** existing event rows and source-health state remain unchanged and the recoverable
  sync error UI is shown

#### Scenario: Event transaction failure prevents health replacement
- **WHEN** transactional event replacement fails
- **THEN** the prior health snapshot remains unchanged and the local error is recorded

#### Scenario: Health-store failure is privacy-safe
- **WHEN** writing the mapped health snapshot fails
- **THEN** the failure is recorded without a URL or token and last-good events remain usable

### Requirement: Mobile source-health data behavior is covered under the logic gate

Pure DTO mapping, snapshot decoding, pruning, restart, and sync branches SHALL be
unit-tested under the 90% logic coverage gate. The sync
wiring test SHALL drive the real generated hook over a mocked `customFetch`, so committed
OpenAPI/generated-client drift and the feature mapping are proved together in CI.

#### Scenario: Generated-contract proof runs in CI
- **WHEN** the mobile Jest suite and generated-client drift check run
- **THEN** a real generated batch-sync hook supplies typed health to the feature mapper and
  the success/failure snapshot semantics are enforced
