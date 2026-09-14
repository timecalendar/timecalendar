## MODIFIED Requirements

### Requirement: MMKV keys have reviewed environment classification

Every known MMKV key SHALL be classified as environment-independent, reset-control, or backend-bound. Theme, language, display-timezone, Calendar view, Show weekends, and Changelog acknowledgement SHALL be environment-independent. Selected environment and the temporary reset journal SHALL be reset-control values. School/group identity, hidden-event identifiers, notification preferences/registration state, remembered feedback e-mail, TanStack persisted-query data, and the versioned export-guide LKG registry SHALL be backend-bound; unclassified future keys SHALL also default to backend-bound. Reset SHALL remove backend-bound values and preserve only explicitly justified survivors. Feature preference code SHALL access the Calendar view only through the settings preference and `@/storage` seams and SHALL NOT import `react-native-mmkv`.

#### Scenario: Classification drives reset

- **WHEN** reset runs with every known key including Calendar view and an export-guide LKG registry populated
- **THEN** every backend-bound value including the catalogue registry is absent and every documented global UI preference including Calendar view and Show weekends is unchanged
- **AND** target selection is retained only after successful completion

#### Scenario: New key requires classification

- **WHEN** a persisted application key is added without a reviewed classification
- **THEN** the classification coverage test fails rather than silently allowing it to survive

#### Scenario: Calendar view persistence stays behind the seam

- **WHEN** the Calendar screen reads or changes its Day, Week, or Agenda preference
- **THEN** it uses the validated settings preference API backed by synchronous string helpers from `@/storage`
- **AND** no Calendar feature file imports the MMKV backend directly

#### Scenario: Export-guide persistence stays behind the seam

- **WHEN** the export-guide repository reads, atomically replaces, or removes its registry document
- **THEN** it uses synchronous string helpers exported from `@/storage`
- **AND** no export-guide feature file imports the MMKV backend directly
