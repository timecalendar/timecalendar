## ADDED Requirements

### Requirement: The color swatch field is a product-free single-choice field

The design layer SHALL provide a color swatch field in the field family. It SHALL import no
product feature module and use no product translation key. It SHALL take from the caller a
required visible label, a list of options each with a color and a required accessible name, the
selected color, a change handler, a required test ID, an optional error, a disabled flag and a
layout-only style that merges last. It SHALL share the text field's label, error and disabled
presentation.

Each option SHALL render as a circular swatch filled with its color, drawn verbatim. The swatch
diameter SHALL equal the platform minimum touch target (44 pt on iOS, 48 dp on Android). Swatches
SHALL sit in a wrapping row with no touch area that extends beyond the swatch. The selected swatch
SHALL show a ring in the primary text color, and an unselected swatch SHALL keep the same border
width in transparent, so selection does not move layout. A press SHALL show platform feedback: a
foreground ripple clipped to the circle on Android, dimming on iOS. A disabled field SHALL show
neither feedback, SHALL NOT report a change, and SHALL expose the disabled state.

The row SHALL be a radio group. On Android each swatch SHALL be a radio with its checked state. On
iOS each swatch SHALL be a button with its selected state. Every swatch's accessible name SHALL be
its option name. Each swatch's test ID SHALL be the field test ID, a hyphen and the option color.

#### Scenario: Selecting a swatch reports its color

- **WHEN** the user presses an unselected swatch in an enabled field
- **THEN** the change handler receives that option's color exactly as given

#### Scenario: Android exposes radios

- **WHEN** the field renders on Android with the second option selected
- **THEN** every swatch is a radio named by its option name, only the second is checked, and the row is a radio group

#### Scenario: iOS exposes selected buttons

- **WHEN** the field renders on iOS with the first option selected
- **THEN** every swatch is a button named by its option name and only the first is selected

#### Scenario: Swatches are platform-sized targets

- **WHEN** the field renders on iOS and then on Android
- **THEN** each swatch is 44 by 44 on iOS and 48 by 48 on Android, circular, with no hit slop

#### Scenario: A disabled field does not change

- **WHEN** the user presses a swatch in a disabled field
- **THEN** the change handler is not called, every swatch exposes the disabled state, and the label and swatches are dimmed

#### Scenario: The field shows its error

- **WHEN** the caller passes an error
- **THEN** the shared field error renders below the swatches with the `-error` suffix on the field test ID

### Requirement: The color swatch field has gallery fixtures

The gallery SHALL list a color-swatch-field fixture with default, error, disabled and long-strings
stories. The fixture's color names SHALL be gallery translation strings, not product keys. The
long-strings story SHALL use the shared longest French stress copy for the label and state whether
the accessibility text size is active. Every story SHALL render in both schemes on both platforms
with an accessible name and role on every swatch.

#### Scenario: The default story selects on press

- **WHEN** the reviewer presses a swatch in the default story
- **THEN** that swatch becomes the selected one
