## MODIFIED Requirements

### Requirement: A row's accessibility is derived from its props

An activatable row SHALL be one accessible element with the button role. Its accessible name SHALL
be the caller's accessible name, or else its overline, label, subtitle and further lines joined in
reading order. Its value SHALL be exposed as the accessibility value, and its hint as the hint. Its
selected, expanded and disabled states SHALL be derived from its props and SHALL NOT be settable by
the caller. Leading icons and elements SHALL be hidden from assistive technology. A static row SHALL
expose its text as one element with the same name and no role, followed by its accessory control
as a separate element.

#### Scenario: A selected row announces its state

- **WHEN** a selected row with a value renders
- **THEN** it exposes the button role, the composed name, the value and the selected state

#### Scenario: A disclosure row announces its state

- **WHEN** a row with a disclosure state renders collapsed and is then expanded by its owner
- **THEN** it exposes the button role with the expanded state false, then true
- **AND** it exposes no selected state

#### Scenario: A static row with an accessory is two stops

- **WHEN** a static row renders with an accessory button
- **THEN** assistive technology reaches the row's text as one element and then the button

## ADDED Requirements

### Requirement: A row can disclose nested content

An activatable row SHALL accept a disclosure state (expanded or collapsed) that is exclusive, at the
type level, with the selected state and the navigation chevron. A disclosure row SHALL draw a
trailing disclosure glyph on both platforms: on iOS a downward chevron when expanded and a forward
chevron when collapsed; on Android the Material expand-less glyph when expanded and expand-more
when collapsed. The glyph SHALL use the navigation chevron's color and text-scaling cap and SHALL be
hidden from assistive technology.

#### Scenario: The glyph follows the state

- **WHEN** a collapsed disclosure row renders on iOS and on Android
- **THEN** iOS shows the forward chevron and Android shows the expand-more glyph
- **AND WHEN** the row is expanded
- **THEN** iOS shows the downward chevron and Android shows the expand-less glyph

#### Scenario: Disclosure and selection cannot combine

- **WHEN** a caller passes both a disclosure state and a selected state, or a disclosure state and
  the navigation chevron
- **THEN** type checking fails

#### Scenario: Gallery covers disclosure

- **WHEN** the list-row gallery renders its states fixture
- **THEN** it includes a collapsed and an expanded disclosure row
