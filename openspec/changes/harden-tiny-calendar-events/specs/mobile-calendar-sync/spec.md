## ADDED Requirements

### Requirement: T10 validates required ranges and optional content independently per row

The shared local Calendar decoder SHALL accept equal timed endpoints as point events, reject reversed timed endpoints, and continue to reject missing/invalid required dates and non-positive date-only ranges with one exhaustive allowlisted reason per rejected row. It SHALL trim usable optional strings, omit unusable optional strings, teachers, and tags, and SHALL never discard an otherwise valid event because optional content is malformed. Decoding SHALL NOT modify synced or personal persisted rows.

#### Scenario: Invalid required rows remain isolated

- **WHEN** missing-start, invalid-end, reversed-timed, invalid-date-only, and valid Maths rows appear in one local result
- **THEN** each invalid row increments exactly one allowlisted rejection count
- **AND** Maths remains accepted and available to downstream filters and presentation

#### Scenario: Timed equality is not a rejection

- **WHEN** a synced or personal timed row has equal valid start and end instants
- **THEN** it is accepted as a point event with its original identity and endpoints
- **AND** no rejection counter increments for that row

#### Scenario: Malformed optional content is omitted

- **WHEN** a valid row contains blank/non-string optional text, malformed teacher JSON, or invalid tag entries
- **THEN** unusable optional values are omitted while usable siblings are normalized
- **AND** the event remains accepted without throwing or writing a repaired row

### Requirement: T10 diagnostics expose allowlisted aggregate facts only

Completed Calendar snapshots SHALL report rejected content at most once per non-zero allowlisted reason and revision through the fixed Calendar local-read diagnostics seam. The emitted value SHALL contain only a static diagnostic code, allowlisted reason, integer count, and fixed subsystem tag. The diagnostic API used by the decoder/snapshot reporter MUST NOT accept or forward raw rows, event/calendar identities, titles, dates, locations, descriptions, source URLs, query values, caught errors, or arbitrary metadata.

#### Scenario: Sentinel content cannot escape

- **WHEN** every malformed field contains distinct fabricated sentinel text and a snapshot completes
- **THEN** serialized diagnostic calls contain only the expected reason/count facts and fixed tag
- **AND** none of the sentinels, row objects, query inputs, or raw error payloads appears

#### Scenario: Re-render does not duplicate aggregate diagnostics

- **WHEN** the same completed revision re-renders without a reason/count change
- **THEN** no diagnostic for that reason/revision is emitted again
- **AND** a later completed revision may emit its own new aggregate count once
