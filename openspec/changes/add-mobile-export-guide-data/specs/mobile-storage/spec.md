## MODIFIED Requirements

### Requirement: MMKV keys have reviewed environment classification
Every known MMKV key SHALL be classified as environment-independent, reset-control, or backend-bound. Theme, language, display-timezone, and Changelog acknowledgement SHALL be environment-independent. Selected environment and the temporary reset journal SHALL be reset-control values. School/group identity, hidden-event identifiers, notification preferences/registration state, remembered feedback e-mail, TanStack persisted-query data, and the versioned export-guide LKG registry SHALL be backend-bound; unclassified future keys SHALL also default to backend-bound. Reset SHALL remove backend-bound values and preserve only explicitly justified survivors. The export-guide feature SHALL access its registry only through `@/storage` helpers and SHALL NOT import `react-native-mmkv`.

#### Scenario: Classification drives reset
- **WHEN** reset runs with every known key including an export-guide LKG registry populated
- **THEN** every backend-bound value including the catalogue registry is absent and every documented global UI preference is unchanged
- **AND** target selection is retained only after successful completion

#### Scenario: New key requires classification
- **WHEN** a persisted application key is added without a reviewed classification
- **THEN** the classification coverage test fails rather than silently allowing it to survive

#### Scenario: Export-guide persistence stays behind the seam
- **WHEN** the export-guide repository reads, atomically replaces, or removes its registry document
- **THEN** it uses synchronous string helpers exported from `@/storage`
- **AND** no export-guide feature file imports the MMKV backend directly
