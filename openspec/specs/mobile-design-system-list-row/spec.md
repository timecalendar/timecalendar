# mobile-design-system-list-row Specification

## Purpose
The shared React Native list row, list section and separator for lists the native list seam cannot
host (virtualized or custom lists): one native-correct row per platform, matched to the seam's
geometry and colors, with the row's accessibility derived from its props.

## Requirements

### Requirement: A list row has a closed, platform-native anatomy

The design layer SHALL provide a list row with a required label and test identifier and these
optional parts: a subtitle, further supporting lines, a status overline in a positive,
informational or destructive tone, a value, a leading icon or leading element of declared width,
a selected check, a destructive label, a disabled state, a hint and a fuller accessible name. A
row SHALL be activated by a press handler or by an in-app route, never both. A row with neither
SHALL be static, and only a static row SHALL accept one trailing accessory control. The row SHALL
NOT accept a color, height, padding or font override; its style SHALL accept layout keys only and
apply last. On iOS a disclosure chevron SHALL render when requested; on Android no chevron SHALL
render. A selected row SHALL show a trailing check on both platforms.

#### Scenario: An accessory inside a pressable row does not compile

- **WHEN** a caller passes both a press handler and a trailing accessory element to a row
- **THEN** `npx tsc --noEmit` fails

#### Scenario: Press handler and route are exclusive

- **WHEN** a caller passes both a press handler and a route to a row
- **THEN** `npx tsc --noEmit` fails

#### Scenario: The chevron follows the platform

- **WHEN** a navigation row requests a chevron
- **THEN** the chevron renders on iOS and nothing renders in its place on Android

#### Scenario: A route row navigates

- **WHEN** the user activates a row given an in-app route
- **THEN** the app pushes that route

### Requirement: Rows meet the platform touch target and press feedback

Every row SHALL be at least 44 pt tall on iOS and 56 dp tall on Android, and SHALL grow with its
content rather than clip. A pressable row SHALL highlight its full shape on iOS while pressed and
SHALL show a ripple clipped to its shape on Android. A disabled row SHALL dim, SHALL show no press
feedback and SHALL NOT activate. A static row SHALL show no press feedback.

#### Scenario: A disabled row ignores a press

- **WHEN** the user presses a disabled row
- **THEN** its handler is not called and the row exposes a disabled state

#### Scenario: Minimum height per platform

- **WHEN** a one-line row renders on iOS and on Android
- **THEN** it is at least 44 pt tall on iOS and at least 56 dp tall on Android

### Requirement: Row text scales with the OS text size without clipping

Every row text line SHALL follow the OS text size with no scaling cap and SHALL carry a positive
line limit, never clipping its last word. At accessibility text sizes the value and the selected
check SHALL move below the label, and a label that is a single word SHALL fit on one line by
shrinking rather than breaking mid-word.

#### Scenario: The value stacks at accessibility sizes

- **WHEN** a row with a value renders at an accessibility text size
- **THEN** the value renders below the label instead of beside it

#### Scenario: A single long word stays whole

- **WHEN** a row's label is one unbreakable word at an accessibility text size
- **THEN** the label renders on one line and shrinks to fit

### Requirement: A row's accessibility is derived from its props

An activatable row SHALL be one accessible element with the button role. Its accessible name SHALL
be the caller's accessible name, or else its overline, label, subtitle and further lines joined in
reading order. Its value SHALL be exposed as the accessibility value, and its hint as the hint. Its
selected and disabled states SHALL be derived from its props and SHALL NOT be settable by the
caller. Leading icons and elements SHALL be hidden from assistive technology. A static row SHALL
expose its text as one element with the same name and no role, followed by its accessory control
as a separate element.

#### Scenario: A selected row announces its state

- **WHEN** a selected row with a value renders
- **THEN** it exposes the button role, the composed name, the value and the selected state

#### Scenario: A static row with an accessory is two stops

- **WHEN** a static row renders with an accessory button
- **THEN** assistive technology reaches the row's text as one element and then the button

### Requirement: Grouped rows match the native list seam

Rows in a list section, or rows given a position in a virtualized list, SHALL render as a grouped
list. On Android they SHALL use the native list seam's segment geometry (2 dp gaps, 20 dp outer and
4 dp inner corners by position, no dividers) and the same seeded Material surface and text colors
as the seam in each color scheme. On iOS they SHALL render as an inset-grouped card with corners
by position and inset separators between rows. The seam and the design rows SHALL read their list
geometry from one shared source. A section title SHALL be exposed as a header. A section SHALL add
no horizontal margin of its own; the page lane owns the side inset.

#### Scenario: Segment corners follow position on Android

- **WHEN** three rows render in a section on Android
- **THEN** the first has 20 dp top and 4 dp bottom corners, the middle 4 dp all round, the last 4 dp
  top and 20 dp bottom, with a 2 dp gap between rows

#### Scenario: The grouped surface matches the seam's

- **WHEN** a grouped row renders on Android in either scheme
- **THEN** its surface and text colors are the seeded Material `surfaceContainer`, `onSurface` and
  `onSurfaceVariant` that the seam's rows use for the same scheme and brand seed

#### Scenario: A section title is a header

- **WHEN** a titled section renders
- **THEN** its title carries the header role

### Requirement: Separators are one primitive with semantic insets

The design layer SHALL provide a separator that is decorative to assistive technology and inset
either nowhere, at the row content start, or at the text start of a row with a leading element of a
given width. Plain (ungrouped) lists SHALL get a list-row separator that renders an inset separator
on iOS and nothing on Android.

#### Scenario: Plain list separators follow the platform

- **WHEN** a plain list uses the list-row separator between rows
- **THEN** an inset separator renders on iOS and nothing renders on Android

#### Scenario: A leading-width inset aligns with the text

- **WHEN** a separator is inset for a leading element of a given width
- **THEN** it starts where the text of a row with that leading element starts

### Requirement: The list family has gallery fixtures for every state

The component gallery SHALL include fixtures for the list row (plain, grouped, states, leading,
static with accessory, overline, longest strings), the list section (titled, single, a side-by-side
comparison with the native list seam, longest strings) and the separator (each inset). The
longest-strings fixtures SHALL use the gallery stress strings in every text slot and SHALL state
whether the accessibility text-size layout is active. Every fixture SHALL render without an
accessibility violation in light and dark on iOS and Android, and the known-violation list SHALL
NOT grow.

#### Scenario: Fixtures pass the registry matrix

- **WHEN** the gallery registry test renders every list fixture in both schemes on both platforms
- **THEN** no interactive element lacks a role or name and no new known violation is listed

### Requirement: Custom lists use the shared row and keep their selectors

The timezone chooser, the school picker, the hidden-events screen, the Activity screen, the
personal-events list and the export-guide provider selection SHALL render their rows with the
shared list row, their row separators with the shared separator, and the hidden-events groups as
list sections. Every row test identifier and every Maestro selector SHALL be kept. The school row's
accessible name SHALL remain exactly the school name. The personal-event row's accessible name and
hint SHALL remain unchanged. The provider row's accessible name and hint SHALL remain unchanged.
The dormant school-group picker SHALL NOT be changed.

#### Scenario: Maestro selectors survive

- **WHEN** the change is complete
- **THEN** every `id:` selector in `mobile/.maestro/` resolves to the same element as before, and
  flow 01 can still tap the seeded school by its exact name

#### Scenario: Hidden events groups are sections

- **WHEN** the hidden-events screen lists name-hidden and uid-hidden entries
- **THEN** each group renders as a titled list section whose rows are static and carry an "Unhide"
  button

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
