## ADDED Requirements

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
