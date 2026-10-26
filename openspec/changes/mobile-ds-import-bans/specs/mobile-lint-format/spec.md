# Spec Delta

## ADDED Requirements

### Requirement: Raw React Native text and modals in feature screens are a ratcheted lint error

Lint SHALL report an error for a value import of React Native's `Text` or `Modal` (aliases and
re-exports included) in every source file under a feature's `ui/` sublayer except tests. A
type-only import SHALL pass. Each primitive SHALL report with its own message naming its
replacement: the shared themed text primitive for `Text`, and a native sheet or modal route or the
native menu for `Modal`. Raw React Native text inputs, activity indicators, buttons and touchables
SHALL stay reported by their existing gates only, so no import is reported twice.

Files not yet migrated SHALL be listed in one committed allowlist that names, per file, the
primitives it still imports and the slice that migrates it; lint SHALL skip only those primitives
for that file. A test SHALL fail when a listed file no longer exists, is listed twice, names an
unknown primitive, no longer imports a listed primitive, or when any primitive's entry count
differs from its pinned ceiling, so the list can only shrink. The design layer and the native
chrome seam SHALL carry no entry.

#### Scenario: A feature screen renders raw text

- **WHEN** a file under `src/features/<feature>/ui/` that is not on the allowlist imports `Text`
  from `react-native`
- **THEN** `npm run lint` fails with a message that points to the themed text primitive

#### Scenario: A feature screen opens a raw modal

- **WHEN** a file under `src/features/<feature>/ui/` imports `Modal` from `react-native`
- **THEN** `npm run lint` fails with a message that points to a native sheet route or the native
  menu

#### Scenario: A ref type import passes

- **WHEN** a feature screen writes `import type { Text } from "react-native"`
- **THEN** the rule reports nothing

#### Scenario: Feature tests and the calendar renderer are out of scope

- **WHEN** a feature test or a file under `src/features/calendar/renderer/` imports `Text` or
  `Modal` from `react-native`
- **THEN** the rule reports nothing

#### Scenario: A raw text input is reported once

- **WHEN** a feature screen not on any allowlist imports `TextInput` from `react-native`
- **THEN** lint reports exactly one error for that import, from the text-field gate

#### Scenario: A listed primitive no longer occurs

- **WHEN** an allowlisted file stops importing a primitive it is listed for, but the entry stays
- **THEN** the allowlist test fails naming the file and the primitive

#### Scenario: An allowlisted file regresses in another primitive

- **WHEN** a file listed only for `Text` adds a `Modal` import
- **THEN** `npm run lint` fails on the `Modal` import

## MODIFIED Requirements

### Requirement: Symbol icons render only through the icon primitive

Lint SHALL report an error for any value import from `expo-symbols` that renders or loads a
symbol (the `SymbolView` component and the Material symbol source loader) and for any import of
an `expo-symbols` sub-path, outside the app's icon primitive module and its test and the native
chrome seam, so every icon a feature or design primitive renders passes through the text-scaling
contract. Type-only imports from `expo-symbols` (symbol name types) SHALL stay allowed.

#### Scenario: A feature imports SymbolView

- **WHEN** a file under `src/features/` imports `SymbolView` from `expo-symbols`
- **THEN** `npm run lint` fails with a message that points to the icon primitive

#### Scenario: A file loads symbol glyphs directly

- **WHEN** a file outside the icon primitive imports `unstable_getMaterialSymbolSourceAsync` from
  `expo-symbols` or imports any `expo-symbols/…` sub-path
- **THEN** `npm run lint` fails with a message that points to the icon primitive

#### Scenario: Chrome wraps a native symbol view

- **WHEN** a file under `src/components/chrome/` imports `SymbolView` from `expo-symbols`
- **THEN** lint reports no error for that import

#### Scenario: A design primitive other than the icon renders a symbol directly

- **WHEN** a file under `src/design/` outside the icon primitive imports `SymbolView` from
  `expo-symbols`
- **THEN** `npm run lint` fails with a message that points to the icon primitive

#### Scenario: Symbol name types stay importable

- **WHEN** a file imports the `SFSymbol` or `AndroidSymbol` type from `expo-symbols`
- **THEN** lint reports no error for that import
