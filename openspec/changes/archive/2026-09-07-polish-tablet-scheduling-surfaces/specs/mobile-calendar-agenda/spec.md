## ADDED Requirements

### Requirement: Agenda presentation shares a measured standard lane
Calendar Agenda SHALL place its loaded rows, section headers, empty/error status presentation, and refreshable content in one `standard` lane resolved from the positive width of the Calendar content owner. The lane SHALL remain inside the existing safe-area owner and SHALL NOT change event grouping, ordering, refresh semantics, checklist progress, routing, sticky-header behavior, or accessibility labels.

#### Scenario: Loaded Agenda is centered on tablet
- **WHEN** Agenda mode is active and its owner reports a portrait-tablet width
- **THEN** section headers and event rows align within the centered standard lane with tablet gutters
- **AND** rows do not stretch beyond the standard content cap

#### Scenario: Agenda states align with loaded content
- **WHEN** Agenda is empty, sync has failed, or pull-to-refresh is active
- **THEN** its state or refresh presentation uses the same measured standard lane as loaded Agenda content
- **AND** retry and refresh actions preserve their existing behavior

#### Scenario: Phone Agenda behavior is preserved
- **WHEN** Agenda's owner reports a compact width below 600
- **THEN** the list and states use compact gutters in the same single-column order
- **AND** sticky headers, event presses, checklist progress, and refresh remain unchanged
