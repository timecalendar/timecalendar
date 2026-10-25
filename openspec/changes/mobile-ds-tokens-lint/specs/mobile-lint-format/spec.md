# Spec Delta

## ADDED Requirements

### Requirement: Device color-scheme reads are confined to the seam by lint
The lint configuration SHALL report an error when any file imports the `useColorScheme` or
`Appearance` binding from `react-native`, including through a namespace import or a re-export,
except in the `@/hooks/use-color-scheme` seam module. The ban SHALL apply in every file, including
the directories whose blocks re-set `no-restricted-imports` (storage, chrome, Activity, export-guide
and calendar-sources). The error message SHALL name the seam. Other `react-native` imports SHALL be
unaffected.

#### Scenario: Feature code imports the device hook
- **WHEN** a feature or component file adds `import { useColorScheme } from "react-native"`
- **THEN** `npm run lint` fails with a message pointing to `@/hooks/use-color-scheme`

#### Scenario: Appearance is banned in seam-override directories too
- **WHEN** a file under `src/components/chrome/` or `src/features/calendar-sources/` imports `Appearance` from `react-native`
- **THEN** `npm run lint` fails

#### Scenario: The seam module itself is allowed
- **WHEN** `src/hooks/use-color-scheme.ts` imports `useColorScheme` from `react-native`
- **THEN** lint passes

### Requirement: Disabling OS font scaling is a lint error
The lint configuration SHALL report an error for `allowFontScaling={false}` on any JSX element
and for an `allowFontScaling: false` object property (the spread-props form), in every linted
file with no exemption. Capping scale with `maxFontSizeMultiplier` SHALL remain allowed.

#### Scenario: A text element disables font scaling
- **WHEN** a component renders `<Text allowFontScaling={false}>`
- **THEN** `npm run lint` fails with a message stating that text must follow the OS font size

#### Scenario: Spread props disable font scaling
- **WHEN** a file defines an object literal with `allowFontScaling: false`
- **THEN** `npm run lint` fails

#### Scenario: A scale cap is allowed
- **WHEN** a component renders `<Text maxFontSizeMultiplier={1.3}>`
- **THEN** lint passes
