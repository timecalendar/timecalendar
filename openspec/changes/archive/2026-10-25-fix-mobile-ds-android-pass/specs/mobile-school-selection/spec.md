## ADDED Requirements

### Requirement: The school search query is legible in both schemes

The school picker's native header search field SHALL draw the typed query in the theme's primary text color, its hint in the secondary text color, and its icons in the primary text color, in light and dark schemes.

#### Scenario: Dark-scheme query text

- **WHEN** the school picker renders in the dark scheme
- **THEN** the header search field's text color is the dark theme's primary text color

### Requirement: The school list's load-failure state is inset from the screen edges

When the school list fails to load and holds no cached schools, the error title, message and Retry action SHALL be inset horizontally and vertically by the same spacing as the list's other status states, so no content touches the screen edges.

#### Scenario: Error state inset

- **WHEN** the schools fetch fails with no cached schools
- **THEN** the error state carries the same horizontal and vertical inset as the loading, empty and no-results statuses

#### Scenario: The group picker error state keeps its lane inset

- **WHEN** the group list fails to load with no cached groups
- **THEN** the error state sits inside the standard content lane's horizontal gutter
