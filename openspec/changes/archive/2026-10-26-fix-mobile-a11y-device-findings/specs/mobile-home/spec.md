## ADDED Requirements

### Requirement: The Home app name uses the type ramp and never breaks mid-word

The Home header's app name SHALL render the platform type ramp's title-2 step with no local size override, on one line, with its font scale capped by the shared brand-text cap. It SHALL be exposed as a heading.

#### Scenario: App name at the largest text size

- **WHEN** Home renders at iOS AX5 or Android font scale 2.0
- **THEN** the app name renders the title-2 ramp step on a single line with its font scale capped at 1.5
- **AND** the app name is exposed with the header role
