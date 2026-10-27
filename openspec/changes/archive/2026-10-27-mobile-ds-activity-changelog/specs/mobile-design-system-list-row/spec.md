## ADDED Requirements

### Requirement: The list section header is a standalone primitive with an optional detail line

The design layer SHALL provide the list section's title as its own component, so that a
virtualized list can render the same section header from its section-header slot. With a title
only, it SHALL render exactly the list section's title: the platform section-title style (iOS
footnote in the secondary label color, Android label in the action color), the header role, the
same line cap and the same padding. A titled list section SHALL render its title through this
component.

The header SHALL take an optional detail line, rendered below the title in the footnote style and
the secondary label color on both platforms. With a detail line, the title and the detail SHALL
form one heading element whose accessible name is the caller's accessibility label, or the title
and the detail joined when the caller gives none; neither line SHALL be a separate heading. The
header SHALL take a test ID and a layout-only style that merges last, and SHALL take no color,
font or size override.

#### Scenario: A list section's title is unchanged

- **WHEN** a titled list section renders on iOS and then on Android
- **THEN** its title has the same text style, color, role, line cap, padding and `-title` test ID
  as before the header became its own component

#### Scenario: A header with a detail is one heading

- **WHEN** the header renders with a title, a detail and an accessibility label
- **THEN** exactly one heading element is exposed, named by the accessibility label, with the title
  and the detail visible below each other

#### Scenario: A header without a caller label names itself

- **WHEN** the header renders with a title and a detail and no accessibility label
- **THEN** its heading is named by the title and the detail joined

#### Scenario: The header has a gallery story

- **WHEN** the gallery registry test renders the list-section header-detail story in both schemes
  on both platforms
- **THEN** it renders with no accessibility violation, including with the shared longest stress
  strings
