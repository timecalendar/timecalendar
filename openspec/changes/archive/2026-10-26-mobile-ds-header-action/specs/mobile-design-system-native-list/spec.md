# Spec Delta

## MODIFIED Requirements

### Requirement: The native list seam is named for lists, not settings

The native grouped-list seam SHALL expose its list, section, row, switch row, choice row, radio
dialog, alert, brand header and numeric editor under the `NativeList` name family from the chrome
barrel (`NativeList`, `NativeListSection`, `NativeListRow`, `NativeListSwitchRow`,
`NativeListChoiceRow`, `NativeListRadioDialog`, `NativeListAlert`, `NativeListHeader`,
`NativeListNumericEditor`). Its source files SHALL be named `native-list*`. The floating action
and the SF Symbol / Material Symbol icon pair SHALL NOT be list names. They are the chrome-wide
`FloatingAction` and `NativeIcon`, which any screen uses with or without a list. The seam SHALL NOT
export any `NativeSettings*` name, and SHALL NOT export a `NativeListFloatingAction` or
`NativeListIcon` name or alias. Renaming SHALL NOT change any control's props, rendering,
geometry, accessibility semantics or the testIDs a consumer supplies.

#### Scenario: Consumers import the list names

- **WHEN** a feature screen renders a grouped native list
- **THEN** it imports `NativeList`, `NativeListSection` and `NativeListRow` from
  `@/components/chrome`, and `npx tsc --noEmit` passes

#### Scenario: The old names are not exported

- **WHEN** a file imports `NativeSettingsRow`, `NativeListFloatingAction` or `NativeListIcon` from
  `@/components/chrome`
- **THEN** `npx tsc --noEmit` fails because the barrel exports no such name

#### Scenario: A list page adds through the chrome floating action

- **WHEN** the Android user calendars page renders its add button below a `NativeList` that
  reserves floating-action space
- **THEN** it renders `FloatingAction` with testID `user-calendars-add`, and the list's last row
  clears the button by `Layout.fabClearance`

#### Scenario: Maestro selectors survive the rename

- **WHEN** the native E2E flows run after the rename
- **THEN** every testID they select (for example `user-calendar-row-<id>` and
  `user-calendar-visibility-<id>`) resolves to the same row as before

#### Scenario: A standalone dialog inside the list still fails loudly

- **WHEN** a radio dialog, numeric editor or text-entry dialog first renders inside a
  `NativeList`
- **THEN** it throws "`<component>` must render outside NativeList; place it after
  `</NativeList>`." on both platforms
