# mobile-design-system-text-field Specification

## Purpose
TBD - created by archiving change mobile-ds-text-field. Update Purpose after archive.

## Requirements

### Requirement: Every text field has a visible label

The shared text field SHALL require a label and SHALL render it as visible text above the input on
both platforms. A placeholder SHALL only ever be an example and SHALL NOT replace the label. The
input's accessible name SHALL be the label unless the caller supplies a fuller accessible name, and
its value SHALL be the typed text. Feature code SHALL NOT render a React Native text input
directly (see `mobile-lint-format`).

#### Scenario: A field renders its label

- **WHEN** a screen renders a text field with the label "Calendar link" and a placeholder
- **THEN** "Calendar link" is visible above the input
- **AND** the input's accessible name is "Calendar link"

#### Scenario: A field without a label does not compile

- **WHEN** code renders the text field without a label
- **THEN** `npx tsc --noEmit` fails

### Requirement: The field owns its helper and error text

A text field SHALL show optional helper text below the input and, when given an error, SHALL show
the error below the input in the error color and mark the field boundary with the error color. The
input's accessibility hint SHALL be the error, followed by the helper, followed by the field's own
hint, each only when present. The helper SHALL NOT be a separate assistive-technology stop. The
error SHALL be announced when it appears and again only when its message changes; it SHALL NOT be
re-announced while the user types and the same error remains. When the error clears, the hint
SHALL no longer contain it.

#### Scenario: An error appears

- **WHEN** a field with the helper "Starts with https://" receives the error "Enter a valid link"
- **THEN** the error text is visible below the input and the boundary uses the error color
- **AND** the input's hint is "Enter a valid link. Starts with https://"
- **AND** the error is announced exactly once

#### Scenario: Typing while the error stays

- **WHEN** the user types and the same error message remains
- **THEN** no further announcement is made

#### Scenario: The error clears

- **WHEN** the error is removed
- **THEN** the error text is gone and the hint is the helper alone

### Requirement: Disabled and multiline states

A disabled text field SHALL not accept input, SHALL expose a disabled state to assistive
technology, and SHALL dim its label, box and helper together. A multiline field SHALL show at least
four lines of text at the current text size, SHALL grow with its content, SHALL align text to the
top, and Return SHALL insert a newline instead of submitting.

#### Scenario: Disabled while a request is pending

- **WHEN** the feedback form is sending
- **THEN** the email and message fields expose `{ disabled: true }` and ignore typing

#### Scenario: Multiline grows

- **WHEN** the user types more lines than the minimum height holds
- **THEN** the field grows and no text is clipped

### Requirement: Fields follow the platform look

On iOS a text field SHALL be a rounded filled field with a hairline outline-color boundary, show
focus through the system caret only, and offer the system clear button while editing a single-line
field. On Android a text field SHALL be a Material 3 outlined field: an outline-color boundary at
rest, a thicker brand-color boundary when focused, and the error color on error, without moving the
text when the boundary changes. Field boundaries SHALL meet 3:1 contrast against the page and
element backgrounds in both schemes.

#### Scenario: Focusing a field on Android

- **WHEN** an Android field gains focus
- **THEN** its boundary becomes the thicker brand-color boundary
- **AND** the text position does not change

#### Scenario: Focusing a field on iOS

- **WHEN** an iOS single-line field gains focus
- **THEN** its boundary is unchanged and the native clear button is available while editing

### Requirement: Fields follow the OS text size without clipping

The label, input text, helper and error SHALL follow the OS text size with no cap. A single-line
field SHALL have no fixed height: it SHALL be at least the minimum touch target tall (44 pt iOS,
48 dp Android) and grow with its text. Input text SHALL use the platform body text step.

#### Scenario: Largest text size

- **WHEN** the field renders at font scale 2.0
- **THEN** the input has no fixed height, its minimum height is at least the touch-target minimum,
  and the multiline minimum height is larger than at font scale 1.0

### Requirement: Keyboard and autofill props pass through

A text field SHALL pass the caller's return key, submit behavior, submit handler, keyboard type,
input mode, content type, autocomplete, auto-capitalization, auto-correction, secure entry, maximum
length and placeholder to the native input unchanged, and SHALL forward a ref to the native input
so a form can move focus. The caller's focus and blur handlers SHALL still be called.

#### Scenario: Next moves to the message field

- **WHEN** the user submits the feedback email field with the Next key
- **THEN** focus moves to the message field and the keyboard stays open

### Requirement: Field styling is layout-only and merges last

A text field's and a date-time field's caller style SHALL accept only layout properties (margins,
flex, alignment, width, position) and SHALL be applied after the field's own layout, so a caller
can position the field but cannot change its colors, borders, padding, radius or typography.

#### Scenario: A caller sets a margin

- **WHEN** a caller passes a top margin
- **THEN** the field's root uses the caller's top margin over its own

#### Scenario: A caller sets a color

- **WHEN** a caller passes a background color as the field style
- **THEN** `npx tsc --noEmit` fails

### Requirement: The date-time field is a product-free design primitive

The shared date-time field SHALL live in the design layer, SHALL import no product feature module
and use no product translation key, and SHALL take its label, the stored instant, the display zone,
a value formatter, a change handler, an optional error and a disabled flag from the caller. It SHALL
share the text field's label, error and disabled presentation. It SHALL pass device-local wall-clock
values to the native picker seam and convert picked values back to instants in the display zone.
On Android its accessible name SHALL be the label followed by the formatted value, and its hint
SHALL carry the error.

#### Scenario: The field takes the caller's format

- **WHEN** the personal-event form renders the Starts field on Android
- **THEN** the row shows the text the caller's formatter returns for the stored instant in the display zone
- **AND** the accessible name is "Starts, " followed by that text

#### Scenario: The field shows a range error

- **WHEN** the end is before the start
- **THEN** the Ends field shows the range error below it and, on Android, its hint carries the error

#### Scenario: Process time zones do not change the result

- **WHEN** the field's tests run under `Pacific/Kiritimati`, `Pacific/Pago_Pago` and `America/St_Johns`
- **THEN** the displayed day, the picker's opening day and the committed instant are the same as under UTC for the same display zone

### Requirement: Field fixtures cover every state

The gallery SHALL list a text-field fixture with default, helper, error, disabled, multiline,
keyboard and long-strings stories, and a date-time-field fixture with default, error, disabled and
long-strings stories. Long-strings stories SHALL use the shared longest French stress copy and
state whether the accessibility text size is active. Every story SHALL render in both schemes on
both platforms with an accessible name on every control.

#### Scenario: The error story toggles its error

- **WHEN** the reviewer presses the toggle in the text-field error story
- **THEN** the field shows the error and its hint carries it, and pressing again clears both

### Requirement: The iOS date-time picker lines up with its label and carries its name

On iOS the date-time field's native picker SHALL start at the field's leading edge, aligned with
the label above it and the error below it, at every text size, and SHALL keep the full row width
available so its date and time controls wrap rather than clip at accessibility text sizes. The
field label SHALL be the picker's SwiftUI title, hidden so the label is not drawn a second time.
Native pickers that do not opt in SHALL keep their layout, and the Android field row and dialogs
SHALL be unchanged.

#### Scenario: The picker sits under the label

- **WHEN** the `date-time-field--default` story renders on iOS at the default text size
- **THEN** the leading edge of the first picker control lines up with the leading edge of the
  label "Starts"

#### Scenario: Largest text size

- **WHEN** the `date-time-field--long-strings` story renders on iOS at
  `accessibility-extra-extra-extra-large`
- **THEN** the picker controls start at the leading edge and no control is clipped

#### Scenario: The picker takes the label as its hidden title

- **WHEN** the date-time field with the label "Starts" renders on iOS
- **THEN** the native picker receives "Starts" as its hidden SwiftUI title
- **AND** "Starts" is drawn once, above the picker

#### Scenario: A picker that does not opt in keeps its layout

- **WHEN** a native date-time picker renders on iOS without the leading alignment or a label
- **THEN** it renders the community native control centred in its row, with no leading frame and
  no label

#### Scenario: Android is unchanged

- **WHEN** the date-time field renders on Android
- **THEN** the native picker receives neither the alignment nor the label, and the row, its
  "label, value" name and the date-then-time dialogs are those of the shared field contract

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
