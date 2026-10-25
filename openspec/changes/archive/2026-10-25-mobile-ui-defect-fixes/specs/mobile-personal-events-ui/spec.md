## MODIFIED Requirements

### Requirement: Native date and time pickers are reached only through the @expo/ui chrome wrapper

The personal-events feature SHALL own its single-consumer `DateTimeField` under `mobile/src/features/personal-events/ui/`. The field's native date and time controls SHALL still be rendered through the chrome wrapper `mobile/src/components/chrome/expo-ui.tsx`, the single import site for `@expo/ui` and its date/time control. The field and all feature/route code SHALL NOT import `@expo/ui` or its subpaths directly. The control SHALL retain the platform-native date/time UI, compact Android dialog lifecycle, inline iOS behavior, and display-zone wall-clock conversion in both directions. On Android, where the native dialog picks either a date or a time but not both, the field SHALL present a native date dialog followed by a native time dialog and SHALL commit the chosen calendar day and time of day together as one display-zone wall clock; a cancel at either step SHALL leave the stored value unchanged.

#### Scenario: The feature-owned field imports the native control from the chrome seam

- **WHEN** `DateTimeField` renders a native date or time control
- **THEN** it imports the control from `@/components/chrome`
- **AND** it does not import `@expo/ui` or its subpaths directly

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

## ADDED Requirements

### Requirement: The personal-event Delete action labels in the destructive color

The personal-event form's Delete action SHALL label in the semantic `destructive` color on its neutral surface, never brand pink. That color SHALL meet the WCAG AA 4.5:1 text contrast floor in both schemes.

#### Scenario: Delete is a destructive-colored label

- **WHEN** the edit form shows the Delete action in light or dark scheme
- **THEN** the Delete label renders in that scheme's `destructive` color
