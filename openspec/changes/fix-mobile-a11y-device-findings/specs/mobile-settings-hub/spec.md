## ADDED Requirements

### Requirement: iOS settings rows stack label above value at accessibility text sizes

On iOS, a native settings row that shows a value (value, navigation and action rows) SHALL place the label on its own line above the value when the text size is an accessibility size, with any disclosure chevron kept at the trailing edge. At default text sizes the label and value SHALL stay side by side. The row's accessibility identifier, label, hint and value SHALL be the same in both layouts. Android rows SHALL keep their layout.

#### Scenario: A navigation row with a value at AX5

- **WHEN** the Developer page's Environment row (a navigation row with a value) renders on iOS at an accessibility text size
- **THEN** the label renders above the value in one leading column, and the chevron renders after that column

#### Scenario: A value row at the default size

- **WHEN** a value row renders on iOS at the Large text size
- **THEN** the label and the value render side by side on one line

#### Scenario: Accessibility is unchanged by the layout

- **WHEN** the same row renders at the default size and at an accessibility size
- **THEN** both expose the same accessibility identifier, label and value
