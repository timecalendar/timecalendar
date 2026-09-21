## MODIFIED Requirements

### Requirement: MMKV keys have reviewed environment classification
Every known MMKV key SHALL be classified as environment-independent, reset-control, or backend-bound. Theme, language, display-timezone, Calendar view, Show weekends, and Changelog acknowledgement SHALL be environment-independent. Selected environment and the temporary reset journal SHALL be reset-control values. School/group identity, hidden-event identifiers, notification preferences, notification synchronization dirty/generation metadata, remembered feedback e-mail, TanStack persisted-query data, and the versioned export-guide LKG registry SHALL be backend-bound; unclassified future keys SHALL also default to backend-bound. Notification synchronization persistence SHALL contain no token, calendar identifier, DTO, payload, retry timestamp, or request queue. Reset SHALL remove backend-bound values and preserve only explicitly justified survivors.

#### Scenario: Classification drives reset
- **WHEN** reset runs with every known key, including notification synchronization metadata and an export-guide LKG registry, populated
- **THEN** every backend-bound value is absent and every documented global UI preference is unchanged
- **AND** target selection is retained only after successful completion

#### Scenario: New key requires classification
- **WHEN** a persisted application key is added without a reviewed classification
- **THEN** the classification coverage test fails rather than silently allowing it to survive

#### Scenario: Notification metadata contains no sensitive snapshot
- **WHEN** notification synchronization is dirty, waiting, retrying, or acknowledged
- **THEN** MMKV contains at most its boolean dirty marker and validated numeric generation
- **AND** no FCM token, calendar identifier, locale/zone signature, DTO, payload, error object, or queued job is stored

#### Scenario: Calendar view persistence stays behind the seam
- **WHEN** the Calendar screen reads or changes its Day, Week, or Agenda preference
- **THEN** it uses the validated settings preference API backed by synchronous string helpers from `@/storage`
- **AND** no Calendar feature file imports the MMKV backend directly

#### Scenario: Export-guide persistence stays behind the seam
- **WHEN** the export-guide repository reads, atomically replaces, or removes its registry document
- **THEN** it uses synchronous string helpers exported from `@/storage`
- **AND** no export-guide feature file imports the MMKV backend directly

## ADDED Requirements

### Requirement: Notification synchronization metadata reads are total and crash-safe
The notification feature SHALL access synchronization dirty/generation metadata only through typed helpers over `@/storage`. Missing or malformed dirty state SHALL decode to false; missing, malformed, negative, fractional, or unsafe generation values SHALL decode to zero. Marking new intent SHALL synchronously advance a valid generation and set dirty before the corresponding notification preference mutation. A current-generation acknowledgment SHALL synchronously clear dirty without persisting the acknowledged request body.

#### Scenario: Malformed metadata falls back safely
- **WHEN** stored dirty or generation values are absent or invalid
- **THEN** typed reads return safe defaults without throwing or constructing a request from stored payload data

#### Scenario: Crash before preference mutation leaves replayable intent
- **WHEN** the process ends after generation/dirty writes and before the preference setter completes
- **THEN** recreated storage reports dirty intent and the runtime can replay the complete canonical preference snapshot

#### Scenario: Redundant replay after acknowledgment is safe
- **WHEN** a process ends before a successfully acknowledged dirty marker is observed as cleared
- **THEN** restart may repeat the idempotent full-state PUT without losing or inventing preference state
