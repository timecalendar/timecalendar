# Spec Delta

## Purpose

The shared badge and color dot of the design layer: a short status or count label in a closed set
of theme tones with an explicit accessibility choice, and a decorative event-color marker, so pills
and dots look, scale and announce the same on every screen.

## ADDED Requirements

### Requirement: A badge has a closed tone, size and anatomy

The design layer SHALL provide a badge with a required label and tone and an optional size and
leading icon. The tone SHALL be one of brand, neutral, positive, informational or destructive. The
size SHALL be small or medium, and SHALL default to medium. Each tone SHALL fix the badge's
appearance: brand SHALL be the brand wash with the brand-wash label color, neutral SHALL be the
element background with the secondary text color, and positive, informational and destructive
SHALL be an outline with the label in the tone's color. The badge SHALL NOT accept a color, font or
height override, and its style SHALL accept layout keys only and apply last. Every color the badge
draws SHALL come from the active scheme's theme tokens.

#### Scenario: A color override does not compile

- **WHEN** a caller passes a color to a badge
- **THEN** type checking fails

#### Scenario: A tone resolves per scheme

- **WHEN** a brand badge renders in light and then in dark
- **THEN** its fill is the scheme's brand wash and its label is the scheme's brand-wash label color

#### Scenario: A status badge is outlined

- **WHEN** a positive badge renders
- **THEN** it has no fill, and its outline and label are the scheme's positive color

### Requirement: Badge tones meet contrast in both schemes

Each badge tone's label SHALL meet the 4.5:1 body-text floor against the surfaces the badge is
drawn on, in light and dark, and each pair SHALL be checked by the automated contrast test. For
the brand tone the check SHALL composite the translucent brand wash over each surface.

#### Scenario: A tone change below the floor fails CI

- **WHEN** a token value change drops a badge tone's label below 4.5:1 on a documented surface
- **THEN** the theme test fails

### Requirement: A badge grows with text size without clipping

A badge's label and icon SHALL scale with the operating system text size. The badge SHALL have no
fixed height and SHALL NOT shrink its text to fit. The label SHALL wrap to at most two lines and
SHALL never be clipped mid-glyph.

#### Scenario: Largest text size

- **WHEN** a badge with the longest French gallery label renders at the largest accessibility text
  size in a narrow column
- **THEN** the label wraps onto a second line and the badge grows to contain it

#### Scenario: The icon scales with the text

- **WHEN** a badge with an icon renders at a text scale of 3
- **THEN** the icon's size is three times its default size

### Requirement: A badge declares its accessible name or is hidden

A badge SHALL require its caller to choose an accessible name or to hide it, with no default. A
badge given a name SHALL be one assistive-technology element with that name, read as text, and its
visible label SHALL NOT be announced separately. A badge given no name SHALL be hidden from
VoiceOver and TalkBack, for use where its owning element already announces the same information.

#### Scenario: A count is not read as a bare number

- **WHEN** a badge shows "2/5" with the name "2 of 5 checklist items completed"
- **THEN** assistive technology reads "2 of 5 checklist items completed" and not "2/5"

#### Scenario: A missing choice does not compile

- **WHEN** a caller renders a badge without stating its accessible name or hiding it
- **THEN** type checking fails

#### Scenario: A hidden badge adds no stop

- **WHEN** a hidden badge renders inside a labelled event summary
- **THEN** the badge exposes no element to assistive technology

### Requirement: A color dot is a decorative event-color marker

The design layer SHALL provide a circular color dot that draws a stored event or calendar color
verbatim in a small, medium or large size from theme tokens, defaulting to medium. The dot SHALL be
hidden from VoiceOver and TalkBack and SHALL NOT accept an accessible name; the element that shows
it SHALL own any spoken color name. The dot MAY draw a ring in a named theme surface color (page
background, element background or Home welcome surface) so overlapping dots read as cut out of
that surface. The dot SHALL NOT accept a ring color value or a size override.

#### Scenario: The stored color is drawn verbatim

- **WHEN** a dot renders the color `#E91E63`
- **THEN** its fill is exactly `#E91E63`

#### Scenario: A dot is not announced

- **WHEN** a dot renders inside a list row
- **THEN** the dot exposes no element to assistive technology and the row's accessible name is unchanged

#### Scenario: A ring follows the scheme

- **WHEN** a dot with the Home welcome surface ring renders in light and then in dark
- **THEN** its ring is the scheme's Home welcome surface color

### Requirement: Existing pills and dots render through the badge and the color dot

The brand header caption, the inline checklist progress pill, the personal-events list color
marker and the Home welcome summary dots SHALL render through the shared badge or color dot. Each
SHALL keep its test identifier and its owning element's accessible name. The header caption SHALL
be a brand badge named by its text. The inline checklist pill SHALL be a positive badge when all
items are complete and an informational badge otherwise, show the checked or pending glyph with
`completed/total`, and be hidden, because the owning event summary announces the progress phrase.
The compact checklist variant inside calendar grid tiles is out of scope. The personal-events row
SHALL show a large dot in the event's color and keep its accessible name equal to the event title.
The Home summary SHALL show at most five overlapping medium dots ringed in the Home welcome surface
color, followed by an overflow count, and the summary's announced count SHALL be unchanged.

#### Scenario: Checklist completion switches tone without changing the announcement

- **WHEN** an event's checklist goes from partial to complete
- **THEN** its inline pill changes from informational to positive with the checked glyph
- **AND** the event summary's accessible label still carries the one localized progress phrase

#### Scenario: Personal-event row name is the title

- **WHEN** the personal-events list renders an event titled "Dentist"
- **THEN** the row's accessible name is exactly "Dentist" and the color dot is not announced

#### Scenario: Home dots cap at five

- **WHEN** the Home welcome card summarizes seven events
- **THEN** five color dots render, followed by "+2"

### Requirement: Badge and color dot have gallery fixtures

The gallery SHALL include badge fixtures for every tone, both sizes, the icon, a named count, a
hidden badge inside a labelled container and the longest French label with a caption naming the
active text-size branch. It SHALL include color dot fixtures for every size, the preset palette,
each ring surface and an overlapping stack with an overflow count. Every fixture SHALL render in
light and dark on iOS and Android with no accessibility violation beyond the committed known list,
and the known list SHALL NOT grow. Fixture strings SHALL be translated in French and English.

#### Scenario: Fixtures render in every scheme and platform

- **WHEN** the registry test renders the badge and color dot stories in light and dark on iOS and Android
- **THEN** each renders without error and reports no unlisted accessibility violation
