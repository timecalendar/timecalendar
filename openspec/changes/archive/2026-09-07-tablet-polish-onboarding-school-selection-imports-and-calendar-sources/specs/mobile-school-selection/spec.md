## ADDED Requirements

### Requirement: School and group collections share a measured standard lane
School and group selection screens SHALL align their collection content and non-loaded states to the
shared measured standard lane without changing query, search, selection, persistence, or routing
behavior.

#### Scenario: School collection elements stay aligned
- **WHEN** the school picker is measured at tablet width
- **THEN** rows, separators, list header and footer, loading, empty, and error content share the
  standard lane
- **AND** the native search header remains full width and unchanged

#### Scenario: Group hierarchy stays aligned
- **WHEN** the dormant group picker is measured at tablet width
- **THEN** its hierarchy and surrounding states share the standard lane
- **AND** the route remains dormant with no new shipped navigation path
