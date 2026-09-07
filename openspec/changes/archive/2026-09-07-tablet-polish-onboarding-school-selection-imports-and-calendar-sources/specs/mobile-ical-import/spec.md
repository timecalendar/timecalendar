## ADDED Requirements

### Requirement: iCal URL import uses a measured readable lane
The iCal URL import screen SHALL center its form and all async states in the shared measured readable
lane while preserving validation, submission, reporting, retry, keyboard, and navigation behavior.

#### Scenario: Import form is readable on a tablet
- **WHEN** the iCal URL screen is measured at tablet width
- **THEN** its introduction, field, actions, pending state, error state, and recovery controls share
  the readable lane
- **AND** URL validation and generated-client submission behavior remain unchanged
