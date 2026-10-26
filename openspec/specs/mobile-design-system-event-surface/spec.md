# mobile-design-system-event-surface Specification

## Purpose
The shared event tile: one design-layer primitive that draws every event tile outside the week-grid
renderer in the grid's tint and accent stripe, with contrast-safe, line-capped text and one
accessibility element per event.

## Requirements

### Requirement: EventSurface draws the week-grid event look from the event color

The design layer SHALL provide an `EventSurface` primitive that takes a stored event color and draws
it as the week grid does: the resolved pale surface fill, a 3-unit leading stripe in the resolved
accent color, and, when the platform's increased-contrast signal is on, a 2-unit border in the
resolved outline color. The appearance SHALL come from the theme layer's event appearance resolver
for the current color scheme. The surface SHALL draw no shadow or elevation and SHALL use medium
corner radii. Callers SHALL NOT be able to pass a color, radius, border, shadow or padding: its
style prop SHALL accept layout keys only and SHALL merge last. An invalid color SHALL render the
fallback appearance.

#### Scenario: A tile in light mode

- **WHEN** an `EventSurface` renders with `eventColor="#E91E63"` in the light scheme
- **THEN** its fill is the resolver's light surface for that color, its leading border is 3 units in
  the resolver's accent, and it has no shadow

#### Scenario: Increased contrast adds the outline

- **WHEN** the increased-contrast signal is on
- **THEN** the surface uses the increased-contrast appearance and draws a 2-unit outline border

#### Scenario: A caller tries to restyle the tile

- **WHEN** a caller passes `backgroundColor`, `borderRadius` or `shadowOpacity` in `style`
- **THEN** type-checking fails

### Requirement: Text on an event surface uses the surface foreground and is always line-capped

Text inside an `EventSurface` SHALL be drawn by `EventSurfaceText` in the resolved foreground color,
which meets 4.5:1 against the surface. `EventSurfaceText` SHALL require a `numberOfLines` value, SHALL
NOT accept a tone, theme color, clip ellipsize mode or shrink-to-fit, SHALL grow with the OS text
size, and SHALL fail when rendered outside an `EventSurface`. Title and detail lines SHALL be
distinguished by type step, not by a gray tone.

#### Scenario: Time and location on a light tint

- **WHEN** a Home card shows the time and location of a pink event in the light scheme
- **THEN** both lines are drawn in the surface foreground, not in the secondary text color

#### Scenario: A line without a cap

- **WHEN** a caller renders `EventSurfaceText` without `numberOfLines`
- **THEN** type-checking fails

#### Scenario: Largest text size

- **WHEN** the OS text size is at its largest accessibility setting
- **THEN** tile text grows, keeps its line cap and is never shrunk to fit

### Requirement: An event surface is one accessibility element

An `EventSurface` SHALL be a single pressable accessibility element with the button role, a required
accessibility label and an optional hint, with its text lines not separately focusable. On iOS it
SHALL dim to the pressed state-opacity token while pressed; on Android it SHALL show the theme ripple.
Callers SHALL build the label with the existing event label builders so that the label begins with
the event title.

#### Scenario: A screen reader focuses a Home card

- **WHEN** VoiceOver or TalkBack focuses a Home upcoming card
- **THEN** it reads one element whose name is the Home event label (title, time, location and any
  checklist progress) and whose hint is the details or edit hint

#### Scenario: A tile without a label

- **WHEN** a caller renders `EventSurface` without `accessibilityLabel`
- **THEN** type-checking fails

### Requirement: Event-tile contrast floors are proven for the palette and arbitrary colors

A CI test SHALL check, for every personal-event swatch preset and the fallback color, in light and
dark schemes, with increased contrast on and off, that the resolved foreground meets 4.5:1 against
the resolved surface, that the resolved accent meets 3:1 against the scheme canvas, and that every
resolved color is an opaque six-digit hex. The same floors SHALL be checked over a regular grid of
sRGB colors.

#### Scenario: A palette color regresses

- **WHEN** a change to the resolver makes any palette color's foreground fall below 4.5:1 on its
  surface in either scheme
- **THEN** the theme test fails naming the color, scheme and policy

### Requirement: Checklist progress on an event surface uses the surface foreground

The badge primitive SHALL offer an `onEventSurface` tone that draws its outline and label in the
surrounding event surface's foreground and fails outside an event surface. The checklist progress
indicator SHALL use that tone for its inline pill, and draw its compact pill in the surface
foreground, when rendered inside an event surface; outside one it SHALL keep its status tones.
Complete and partial progress SHALL stay distinguishable by glyph.

#### Scenario: An agenda tile with partial progress

- **WHEN** an agenda tile shows 2 of 5 checklist items completed
- **THEN** the inline pill's outline and label use the tile's foreground and the pending glyph

#### Scenario: A week-grid tile

- **WHEN** a week-grid tile shows checklist progress
- **THEN** the compact pill keeps its positive or informational tone

### Requirement: Home and agenda event tiles render through EventSurface

The Home upcoming card, the Home all-day item, the Home today-timeline tile (positioned and reflowed)
and the agenda tile SHALL render through `EventSurface`, so each gains the accent stripe and
foreground text. Every test identifier these tiles carry SHALL be kept, and every accessible name
SHALL be unchanged. The agenda's now marker SHALL remain outside the tile. No React component file
outside the design layer, the theme module and the week-grid renderer SHALL resolve an event
appearance itself.

#### Scenario: The Maestro import flow taps an agenda event

- **WHEN** the end-to-end flow taps an event by a name beginning with its title
- **THEN** the agenda tile is matched as before

#### Scenario: A timeline tile keeps its geometry

- **WHEN** the today timeline places an event with the overlap engine
- **THEN** the event surface takes the computed top, left, width and height and keeps its
  `today-tile-<id>` identifier

### Requirement: The event surface ships with a gallery fixture

The gallery SHALL include an `event-surface` fixture covering every swatch preset and the fallback
color, both placements and densities, the increased-contrast state, inline and compact checklist
progress, the longest French title, and a caption naming the current text-size branch. Every tile in
the fixture SHALL carry an accessibility label, and the known accessibility violation list SHALL NOT
grow.

#### Scenario: The gallery accessibility matrix runs

- **WHEN** the registry test renders the event-surface stories in light and dark on iOS and Android
- **THEN** it finds no unlabeled element and the known violation list is unchanged
