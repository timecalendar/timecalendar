# Spec Delta

## Purpose

The React Native app's native grouped-list seam: one generic, feature-neutral API for short native
lists (SwiftUI Form on iOS, Material list on Android) that every feature uses directly. The seam
names only what it is, and the retired names stay retired.

## ADDED Requirements

### Requirement: The native list seam is named for lists, not settings

The native grouped-list seam SHALL expose its list, section, row, switch row, choice row, radio
dialog, alert, floating action, brand header, numeric editor and icon type under the `NativeList`
name family from the chrome barrel (`NativeList`, `NativeListSection`, `NativeListRow`,
`NativeListSwitchRow`, `NativeListChoiceRow`, `NativeListRadioDialog`, `NativeListAlert`,
`NativeListFloatingAction`, `NativeListHeader`, `NativeListNumericEditor`, `NativeListIcon`). Its
source files SHALL be named `native-list*`. The seam SHALL NOT export any `NativeSettings*` name or
alias. Renaming SHALL NOT change any control's props, rendering, geometry, accessibility semantics
or the testIDs a consumer supplies.

#### Scenario: Consumers import the list names

- **WHEN** a feature screen renders a grouped native list
- **THEN** it imports `NativeList`, `NativeListSection` and `NativeListRow` from
  `@/components/chrome`, and `npx tsc --noEmit` passes

#### Scenario: The old names are not exported

- **WHEN** a file imports `NativeSettingsRow` from `@/components/chrome`
- **THEN** `npx tsc --noEmit` fails because the barrel exports no such name

#### Scenario: Maestro selectors survive the rename

- **WHEN** the native E2E flows run after the rename
- **THEN** every testID they select (for example `user-calendar-row-<id>` and
  `user-calendar-visibility-<id>`) resolves to the same row as before

#### Scenario: A standalone dialog inside the list still fails loudly

- **WHEN** a radio dialog, numeric editor or text-entry dialog first renders inside a
  `NativeList`
- **THEN** it throws "`<component>` must render outside NativeList; place it after
  `</NativeList>`." on both platforms

### Requirement: Features use the seam directly, with no feature-owned row adapters

No feature SHALL define a row or section wrapper over the native list seam for other features to
import. About SHALL render its sections and rows with `NativeListSection` and `NativeListRow`. The
environment row SHALL render `NativeListRow` directly. The About screen SHALL NOT import the
Settings feature. About and the environment row SHALL keep their visible copy, row order, icons,
hints, values, accessibility roles and labels, and testIDs (`about-privacy`, `about-contact`,
`about-changelog`, `about-developer-samuel`, `about-developer-eddy`, `about-section-<key>`,
`settings-environment`).

#### Scenario: About renders through the seam

- **WHEN** the About screen renders on iOS or Android
- **THEN** each section is a native list section titled with its localized title, each row keeps
  its testID, label, hint and value, and activating a row opens the same link or route as before

#### Scenario: The environment row keeps its contract

- **WHEN** the developer page renders the environment row on a preview-capability build
- **THEN** the row with testID `settings-environment` has the `button` role, the label
  "Environment" and the current environment as its value, and pressing it opens the environment
  choices

#### Scenario: The settings feature exports no row adapter

- **WHEN** a file imports `SettingsRow` or `SettingsSection` from `@/features/settings/ui`
- **THEN** `npx tsc --noEmit` fails

### Requirement: Retired seam names cannot return

Lint SHALL fail any TypeScript source file under `mobile/src/`, tests included, that does any of
the following:

- declares or references an identifier starting with `NativeSettings`, `SwiftSettings` or
  `ComposeSettings`;
- declares or references an identifier named exactly `SettingsRow`, `SettingsRowProps`,
  `SettingsSection` or `SettingsSectionProps`;
- contains a string or template literal with `native-settings` or `nativeSettings` (import paths,
  mock paths, testIDs, story ids, translation keys);
- is itself named `native-settings*`, `settings-row.*` or `settings-section.*`.

The rule SHALL have no allowlist. The lint message SHALL name the `NativeList*` replacement.
Product names that only end in `SettingsRow`, such as `EnvironmentSettingsRow`, SHALL pass.

#### Scenario: A retired identifier fails lint

- **WHEN** a feature file declares `function SettingsRow()` or imports `NativeSettingsRow`
- **THEN** `npm run lint` fails naming the file and the `NativeList*` replacement

#### Scenario: A retired string fails lint

- **WHEN** a test passes `testID="gallery-native-settings-rows"` or calls
  `t("gallery.nativeSettings.title")`
- **THEN** `npm run lint` fails naming the file

#### Scenario: A recreated adapter file fails lint

- **WHEN** `src/features/settings/ui/settings-row.tsx` is recreated, even with no importer
- **THEN** `npm run lint` fails naming the file

#### Scenario: A product row name passes

- **WHEN** `src/features/environment/ui/environment-settings-row.tsx` declares
  `EnvironmentSettingsRow`
- **THEN** the rule reports nothing for that file

#### Scenario: The rule is proven by its own suite

- **WHEN** `npx jest tools/eslint-rules` runs
- **THEN** the rule's RuleTester suite passes, covering identifier, type, JSX, string, template
  and file-name cases, valid product names and the `NativeList*` names
