## ADDED Requirements

### Requirement: Home section titles are headings in every state

The Home "Up next" and "Today" section titles SHALL be exposed to assistive technology as headings and SHALL render the platform type ramp's section-title step whether the section is empty or populated, so one title never changes size, weight or role with the section's state.

#### Scenario: Populated sections expose heading titles

- **WHEN** Home renders with events in both the Today and Up next sections
- **THEN** "Today" and "Up next" are each exposed with the header role
- **AND** each renders the section-title ramp step with no local font size, line height or weight override

#### Scenario: Empty and populated titles match

- **WHEN** a section changes from empty to populated
- **THEN** its title keeps the header role and the same section-title ramp step
