# Spec Delta

## MODIFIED Requirements

### Requirement: Agenda list renders day-grouped events as a brand surface

The calendar feature `ui/` sublayer SHALL provide a presentational agenda list — a React Native
`SectionList` of day-grouped events — as a designed brand surface themed from `@/theme` tokens (R-3).
Each day SHALL render a header (the formatted weekday abbreviation + day number); each event SHALL
render an event surface tile showing its title, its formatted time range, and its location (when
present), drawn in the event's resolved surface tint with its resolved accent as a leading stripe,
with no gray fill and no shadow (the week-grid event look). A now/upcoming indicator (brand
`primary`) SHALL mark the current position outside the tile. The list SHALL NOT create, edit or
delete events.

#### Scenario: Day sections with headers

- **WHEN** the agenda list renders day-grouped events
- **THEN** each day is a section with a header showing the formatted short weekday + day-of-month, and
  empty days produce no section

#### Scenario: Event tiles show title, time, and location

- **WHEN** a day section renders its events
- **THEN** each event tile shows the title, the formatted `HH:mm – HH:mm` time range, and the location
  when present, in the event's resolved tint with an accent stripe and text in the tile foreground
- **AND** the tile draws no shadow and no `backgroundElement` fill

#### Scenario: Now/upcoming indicator

- **WHEN** the agenda renders and the current time falls within the displayed range
- **THEN** a now/upcoming indicator in the brand `primary` marks the current position

#### Scenario: Theme comes from tokens

- **WHEN** the agenda surface renders
- **THEN** its colors (surfaces, text, the now-indicator) derive from `@/theme` tokens and the theme
  layer's event appearance resolver (R-3)

#### Scenario: Read-only, no write path

- **WHEN** the agenda is used
- **THEN** it does not create, edit or delete events; pressing a tile opens that event's details

#### Scenario: List engine is the zero-dep SectionList

- **WHEN** the agenda list is implemented
- **THEN** it uses the React Native core `SectionList` (no FlashList / no native list dependency this
  ship)
