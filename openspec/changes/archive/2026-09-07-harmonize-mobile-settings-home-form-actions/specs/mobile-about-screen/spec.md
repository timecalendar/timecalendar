## ADDED Requirements

### Requirement: About prose has one readable responsive gutter
The About screen SHALL retain one measured `standard` lane for grouped actions and SHALL bound only its introductory prose and link-error prose to the readable maximum width. Those prose blocks SHALL reuse the standard lane's responsive horizontal gutter and SHALL NOT apply a second nested responsive gutter. Grouped action sections SHALL retain the standard width, row geometry, and tablet behavior.

#### Scenario: Compact About applies one gutter
- **WHEN** About is measured at a compact phone width
- **THEN** the introductory prose uses the standard lane's single horizontal gutter
- **AND** no nested readable padding compounds that inset

#### Scenario: Tablet prose is capped without narrowing actions
- **WHEN** About is measured at a supported tablet portrait width
- **THEN** the introductory and link-error prose blocks are centered and capped at the readable maximum width
- **AND** grouped action sections continue to use the wider standard lane
