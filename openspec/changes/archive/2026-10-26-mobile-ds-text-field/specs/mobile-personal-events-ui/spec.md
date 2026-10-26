# Spec Delta

## REMOVED Requirements

### Requirement: Native date and time pickers are reached only through the @expo/ui chrome wrapper

**Reason**: The personal-events feature no longer owns a date/time field. The ADDED requirement
"The personal-event form uses the design-layer date/time field over the @expo/ui chrome wrapper"
carries every behavior of this one (chrome-only `@expo/ui` access, native pickers, Android
two-step commit, display-zone conversion) with the field owned by the design layer.

**Migration**: Import `DateTimeField` from `@/design` and pass the label, the stored instant, the
display zone, a value formatter and the change handler.

## ADDED Requirements

### Requirement: The personal-event form uses the design-layer date/time field over the @expo/ui chrome wrapper

The personal-event form SHALL render its start and end values through the design layer's shared `DateTimeField` (`mobile/src/design/field/`), imported from `@/design`; the personal-events feature SHALL NOT own a date/time field component. The field's native date and time controls SHALL still be rendered through the chrome wrapper `mobile/src/components/chrome/expo-ui.tsx`, the single import site for `@expo/ui` and its date/time control. The field and all feature/route code SHALL NOT import `@expo/ui` or its subpaths directly. The control SHALL retain the platform-native date/time UI, compact Android dialog lifecycle, inline iOS behavior, and display-zone wall-clock conversion in both directions. On Android, where the native dialog picks either a date or a time but not both, the field SHALL present a native date dialog followed by a native time dialog and SHALL commit the chosen calendar day and time of day together as one display-zone wall clock; a cancel at either step SHALL leave the stored value unchanged.

#### Scenario: The design-layer field imports the native control from the chrome seam

- **WHEN** `DateTimeField` renders a native date or time control
- **THEN** it imports the control from `@/components/chrome`
- **AND** it does not import `@expo/ui` or its subpaths directly

#### Scenario: The personal-event form uses the shared field

- **WHEN** the personal-event form renders its Starts and Ends fields
- **THEN** both are the `DateTimeField` from `@/design`
- **AND** no date/time field component exists under `mobile/src/features/personal-events/`

#### Scenario: @expo/ui remains isolated to the chrome wrapper

- **WHEN** `@expo/ui` or a subpath is imported anywhere in the app
- **THEN** the only import site is `mobile/src/components/chrome/expo-ui.tsx`
- **AND** the chrome barrel re-exports the wrapped control

#### Scenario: Display-zone conversion survives the ownership move

- **WHEN** a stored instant is shown and changed while the effective display zone differs from the device zone
- **THEN** the picker receives the display zone's wall-clock value
- **AND** the chosen wall-clock value is converted back to the correct stored instant

#### Scenario: Android sets date and time in two native steps

- **WHEN** the user taps the Android field, confirms a day in the date dialog, and then confirms a time in the time dialog
- **THEN** the field reports exactly one change whose display-zone wall clock has the confirmed day and the confirmed hour and minute
- **AND** no change is reported after the date step alone
- **AND** no dialog remains open after the time step

#### Scenario: Android date step preserves the calendar day across zones

- **WHEN** the effective display zone is ahead of or behind UTC and the user confirms a day in the Android date dialog
- **THEN** the date dialog opens with the stored value's display-zone day selected
- **AND** the time dialog opens with the confirmed day and the stored value's display-zone time of day

#### Scenario: Cancelling either Android step is inert

- **WHEN** the user dismisses the Android date dialog, or confirms a date and then dismisses the time dialog
- **THEN** the field reports no change and the stored value is unchanged
- **AND** no dialog remains open and the field can be reopened

#### Scenario: iOS keeps the single inline date-time control

- **WHEN** the field renders on iOS
- **THEN** it renders one inline native date-and-time control and reports each change directly in the display zone

## MODIFIED Requirements

### Requirement: The Android date/time field announces its current value

On Android, the personal-event date/time field's accessible name SHALL include both the field's localized label and its currently displayed date and time, joined by a comma, so a screen reader that reads the focused control's label instead of its child text still announces the value. The name SHALL follow the value after a commit. The label SHALL be localized in French and English by the form; the field SHALL use no translation key of its own.

#### Scenario: The field's name includes the value

- **WHEN** the Android personal-event form shows the Starts field with a value
- **THEN** the field's accessible name is the Starts label followed by a comma, a space and the same formatted date and time the field displays

#### Scenario: The name follows a committed change

- **WHEN** the user commits a new date and time through the native dialogs
- **THEN** the field's accessible name contains the newly displayed value
